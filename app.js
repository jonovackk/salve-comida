const { useEffect, useMemo, useState } = React;

/** Persistência **/
const STORAGE_KEY = "salvecomida:v2";

/** Utilidades **/
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function createUserId(email) {
  const normalized = normalizeEmail(email);
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return `user_${hash.toString(36)}`;
}

function createId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseQuantityString(quantity) {
  if (!quantity || typeof quantity !== "string") {
    return { amount: 0, unit: "unidades" };
  }

  const match = quantity.trim().match(/^([\d.,]+)\s*(.*)$/);
  if (!match) {
    return { amount: 0, unit: "unidades" };
  }

  const amount = Number(match[1].replace(",", "."));
  const unit = (match[2] || "unidades").trim() || "unidades";

  return {
    amount: Number.isFinite(amount) ? amount : 0,
    unit,
  };
}

function formatQuantity(amount, unit) {
  if (!Number.isFinite(amount)) return `0 ${unit || "unidades"}`;
  const normalized =
    Math.round(amount) === amount ? String(amount) : String(amount).replace(".", ",");
  return `${normalized} ${unit || "unidades"}`;
}

function getStepByUnit(unit) {
  const normalizedUnit = (unit || "").toLowerCase();
  if (normalizedUnit.includes("kg") || normalizedUnit.includes("litro")) return 0.5;
  return 1;
}

function sanitizeNumber(value, fallback = 0) {
  const num =
    typeof value === "number"
      ? value
      : Number(String(value || "").replace(",", "."));
  return Number.isFinite(num) ? num : fallback;
}

function sumReservedAmount(product) {
  return (product.requests || [])
    .filter((request) => request.status === "reserved")
    .reduce((total, request) => total + sanitizeNumber(request.amount, 0), 0);
}

function sumPickedUpAmount(product) {
  return (product.pickupsHistory || []).reduce(
    (total, pickup) => total + sanitizeNumber(pickup.amount, 0),
    0
  );
}

function getAvailableAmount(product) {
  const stockAmount = sanitizeNumber(product.stockAmount, 0);
  const reserved = sumReservedAmount(product);
  const picked = sumPickedUpAmount(product);
  return Math.max(0, stockAmount - reserved - picked);
}

function clampPositiveNumber(value) {
  const parsed = sanitizeNumber(value, 0);
  return parsed > 0 ? parsed : 0;
}

function ensureCategory(value) {
  return value || "Outros";
}

function ensureExpiryDate(value) {
  return value || "2026-12-31";
}

function normalizeLegacyProduct(product) {
  const parsed = parseQuantityString(product.quantity);
  const stockAmount =
    typeof product.stockAmount === "number"
      ? product.stockAmount
      : sanitizeNumber(parsed.amount, 0);

  const unit = product.unit || parsed.unit || "unidades";
  const defaultMaxPerPerson = stockAmount > 1 ? Math.max(1, Math.floor(stockAmount * 0.4)) : 1;

  return {
    ...product,
    stockAmount,
    unit,
    category: ensureCategory(product.category),
    expiryDate: ensureExpiryDate(product.expiryDate),
    maxPerPerson:
      typeof product.maxPerPerson === "number"
        ? product.maxPerPerson
        : defaultMaxPerPerson,
    minRemainingAmount:
      typeof product.minRemainingAmount === "number"
        ? product.minRemainingAmount
        : stockAmount > 1
        ? getStepByUnit(unit)
        : 0,
    requests: Array.isArray(product.requests) ? product.requests : [],
    pickupsHistory: Array.isArray(product.pickupsHistory) ? product.pickupsHistory : [],
    status: product.status || "available",
  };
}

function mergeProducts(primary, fallback) {
  const byId = new Map();
  primary.forEach((product) => byId.set(product.id, normalizeLegacyProduct(product)));
  fallback.forEach((product) => {
    if (!byId.has(product.id)) {
      byId.set(product.id, normalizeLegacyProduct(product));
    }
  });
  return Array.from(byId.values());
}

/** Mock data **/
const mockAvailableProducts = [
  {
    id: "1",
    name: "Arroz Branco",
    quantity: "20 kg",
    category: "Grãos",
    expiryDate: "2026-12-31",
    location: "São Paulo, SP",
    description: "Arroz tipo 1, pacote fechado",
    donorId: "user1",
    donorName: "João Silva",
    createdAt: "2026-02-01",
    status: "available",
  },
  {
    id: "2",
    name: "Feijão Preto",
    quantity: "15 kg",
    category: "Grãos",
    expiryDate: "2026-12-15",
    location: "São Paulo, SP",
    description: "Feijão preto de qualidade",
    donorId: "user2",
    donorName: "Maria Santos",
    createdAt: "2026-02-02",
    status: "available",
  },
  {
    id: "3",
    name: "Maçãs",
    quantity: "50 unidades",
    category: "Frutas",
    expiryDate: "2026-03-15",
    location: "São Paulo, SP",
    description: "Maçãs frescas",
    donorId: "user3",
    donorName: "Pedro Costa",
    createdAt: "2026-02-03",
    status: "available",
  },
  {
    id: "4",
    name: "Leite Integral",
    quantity: "20 litros",
    category: "Laticínios",
    expiryDate: "2026-06-15",
    location: "Rio de Janeiro, RJ",
    description: "Leite integral UHT",
    donorId: "user4",
    donorName: "Ana Lima",
    createdAt: "2026-02-03",
    status: "available",
  },
  {
    id: "5",
    name: "Tomate",
    quantity: "25 kg",
    category: "Vegetais",
    expiryDate: "2026-03-10",
    location: "São Paulo, SP",
    description: "Tomates frescos",
    donorId: "user5",
    donorName: "Carlos Oliveira",
    createdAt: "2026-02-04",
    status: "available",
  },
  {
    id: "6",
    name: "Batata",
    quantity: "30 kg",
    category: "Vegetais",
    expiryDate: "2026-04-01",
    location: "São Paulo, SP",
    description: "Batata inglesa",
    donorId: "user6",
    donorName: "Fernanda Rocha",
    createdAt: "2026-02-02",
    status: "available",
  },
  {
    id: "7",
    name: "Banana",
    quantity: "60 unidades",
    category: "Frutas",
    expiryDate: "2026-02-28",
    location: "Campinas, SP",
    description: "Bananas maduras",
    donorId: "user7",
    donorName: "Bruno Almeida",
    createdAt: "2026-02-03",
    status: "available",
  },
  {
    id: "8",
    name: "Iogurte Natural",
    quantity: "40 potes",
    category: "Laticínios",
    expiryDate: "2026-03-20",
    location: "São Paulo, SP",
    description: "Sem açúcar",
    donorId: "user8",
    donorName: "Luciana Pires",
    createdAt: "2026-02-03",
    status: "available",
  },
  {
    id: "9",
    name: "Atum em Lata",
    quantity: "30 latas",
    category: "Enlatados",
    expiryDate: "2027-01-20",
    location: "Santos, SP",
    description: "Atum sólido em água",
    donorId: "user9",
    donorName: "Ricardo Souza",
    createdAt: "2026-02-04",
    status: "available",
  },
  {
    id: "10",
    name: "Peito de Frango",
    quantity: "12 kg",
    category: "Proteínas",
    expiryDate: "2026-03-30",
    location: "São Paulo, SP",
    description: "Congelado",
    donorId: "user10",
    donorName: "Patrícia Gomes",
    createdAt: "2026-02-04",
    status: "available",
  },
  {
    id: "bruda-01",
    name: "Arroz Integral",
    quantity: "20 kg",
    category: "Grãos",
    expiryDate: "2026-10-10",
    location: "Canoinhas - SC",
    description: "Pacote fechado",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-02",
    name: "Macarrão Espaguete",
    quantity: "40 pacotes",
    category: "Outros",
    expiryDate: "2026-12-01",
    location: "Canoinhas - SC",
    description: "Massa seca",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-03",
    name: "Farinha de Trigo",
    quantity: "20 kg",
    category: "Grãos",
    expiryDate: "2026-11-20",
    location: "Canoinhas - SC",
    description: "Tipo 1",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-04",
    name: "Óleo de Soja",
    quantity: "18 litros",
    category: "Outros",
    expiryDate: "2027-01-15",
    location: "Canoinhas - SC",
    description: "Garrafa PET",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-05",
    name: "Açúcar Cristal",
    quantity: "25 kg",
    category: "Outros",
    expiryDate: "2026-12-20",
    location: "Canoinhas - SC",
    description: "Saco fechado",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-06",
    name: "Sal Refinado",
    quantity: "12 kg",
    category: "Outros",
    expiryDate: "2027-06-30",
    location: "Canoinhas - SC",
    description: "Sal iodado",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-07",
    name: "Café Moído",
    quantity: "15 pacotes",
    category: "Outros",
    expiryDate: "2026-09-30",
    location: "Canoinhas - SC",
    description: "500 g cada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-08",
    name: "Leite em Pó",
    quantity: "10 kg",
    category: "Laticínios",
    expiryDate: "2026-08-18",
    location: "Canoinhas - SC",
    description: "Integral",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-09",
    name: "Queijo Muçarela",
    quantity: "8 kg",
    category: "Laticínios",
    expiryDate: "2026-03-15",
    location: "Canoinhas - SC",
    description: "Fatiado",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-10",
    name: "Presunto Cozido",
    quantity: "6 kg",
    category: "Proteínas",
    expiryDate: "2026-03-12",
    location: "Canoinhas - SC",
    description: "Fatiado",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-11",
    name: "Pão de Forma",
    quantity: "30 pacotes",
    category: "Outros",
    expiryDate: "2026-02-20",
    location: "Canoinhas - SC",
    description: "Fatiado tradicional",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-12",
    name: "Ovos Brancos",
    quantity: "20 dúzias",
    category: "Outros",
    expiryDate: "2026-03-05",
    location: "Canoinhas - SC",
    description: "Ovos grandes",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-13",
    name: "Cenoura",
    quantity: "20 kg",
    category: "Vegetais",
    expiryDate: "2026-02-22",
    location: "Canoinhas - SC",
    description: "Frescas",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-14",
    name: "Alface Crespa",
    quantity: "40 unidades",
    category: "Vegetais",
    expiryDate: "2026-02-12",
    location: "Canoinhas - SC",
    description: "Higienizada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-15",
    name: "Cebola",
    quantity: "20 kg",
    category: "Vegetais",
    expiryDate: "2026-03-10",
    location: "Canoinhas - SC",
    description: "Amarela",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-16",
    name: "Alho",
    quantity: "8 kg",
    category: "Vegetais",
    expiryDate: "2026-04-15",
    location: "Canoinhas - SC",
    description: "Dentes selecionados",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-17",
    name: "Maçã Gala",
    quantity: "24 kg",
    category: "Frutas",
    expiryDate: "2026-02-25",
    location: "Canoinhas - SC",
    description: "Selecionadas",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-18",
    name: "Laranja Pera",
    quantity: "25 kg",
    category: "Frutas",
    expiryDate: "2026-03-01",
    location: "Canoinhas - SC",
    description: "Saco fechado",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-19",
    name: "Banana Prata",
    quantity: "30 dúzias",
    category: "Frutas",
    expiryDate: "2026-02-15",
    location: "Canoinhas - SC",
    description: "Maduras",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-20",
    name: "Mamão",
    quantity: "30 unidades",
    category: "Frutas",
    expiryDate: "2026-02-16",
    location: "Canoinhas - SC",
    description: "Formosa",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-21",
    name: "Iogurte de Morango",
    quantity: "50 potes",
    category: "Laticínios",
    expiryDate: "2026-02-28",
    location: "Canoinhas - SC",
    description: "170 g cada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-22",
    name: "Manteiga",
    quantity: "10 kg",
    category: "Laticínios",
    expiryDate: "2026-04-05",
    location: "Canoinhas - SC",
    description: "Com sal",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-23",
    name: "Requeijão",
    quantity: "30 potes",
    category: "Laticínios",
    expiryDate: "2026-03-18",
    location: "Canoinhas - SC",
    description: "Cremoso",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-24",
    name: "Carne Moída",
    quantity: "15 kg",
    category: "Proteínas",
    expiryDate: "2026-03-08",
    location: "Canoinhas - SC",
    description: "Congelada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-25",
    name: "Coxa de Frango",
    quantity: "18 kg",
    category: "Proteínas",
    expiryDate: "2026-03-10",
    location: "Canoinhas - SC",
    description: "Congelada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-26",
    name: "Salsicha",
    quantity: "12 kg",
    category: "Proteínas",
    expiryDate: "2026-03-20",
    location: "Canoinhas - SC",
    description: "Resfriada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-27",
    name: "Atum Ralado",
    quantity: "40 latas",
    category: "Enlatados",
    expiryDate: "2027-04-10",
    location: "Canoinhas - SC",
    description: "Em óleo",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-28",
    name: "Sardinha em Lata",
    quantity: "50 latas",
    category: "Enlatados",
    expiryDate: "2027-02-12",
    location: "Canoinhas - SC",
    description: "Ao molho de tomate",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-29",
    name: "Milho Verde",
    quantity: "40 latas",
    category: "Enlatados",
    expiryDate: "2027-01-30",
    location: "Canoinhas - SC",
    description: "Lata 200 g",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-30",
    name: "Ervilha",
    quantity: "40 latas",
    category: "Enlatados",
    expiryDate: "2027-01-30",
    location: "Canoinhas - SC",
    description: "Lata 200 g",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-31",
    name: "Molho de Tomate",
    quantity: "36 sachês",
    category: "Outros",
    expiryDate: "2026-12-10",
    location: "Canoinhas - SC",
    description: "340 g cada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-32",
    name: "Biscoito Água e Sal",
    quantity: "40 pacotes",
    category: "Outros",
    expiryDate: "2026-08-25",
    location: "Canoinhas - SC",
    description: "Pacote 400 g",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-33",
    name: "Biscoito Recheado",
    quantity: "50 pacotes",
    category: "Outros",
    expiryDate: "2026-07-30",
    location: "Canoinhas - SC",
    description: "Sabor chocolate",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-34",
    name: "Aveia em Flocos",
    quantity: "20 pacotes",
    category: "Grãos",
    expiryDate: "2026-11-05",
    location: "Canoinhas - SC",
    description: "300 g cada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-35",
    name: "Granola",
    quantity: "16 pacotes",
    category: "Grãos",
    expiryDate: "2026-10-25",
    location: "Canoinhas - SC",
    description: "Tradicional",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-36",
    name: "Suco de Uva",
    quantity: "24 litros",
    category: "Outros",
    expiryDate: "2026-09-15",
    location: "Canoinhas - SC",
    description: "Integral",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-37",
    name: "Água Mineral",
    quantity: "60 garrafas",
    category: "Outros",
    expiryDate: "2027-02-01",
    location: "Canoinhas - SC",
    description: "500 ml",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-38",
    name: "Refrigerante Cola",
    quantity: "30 garrafas",
    category: "Outros",
    expiryDate: "2026-10-02",
    location: "Canoinhas - SC",
    description: "2 litros",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-39",
    name: "Farofa Pronta",
    quantity: "20 pacotes",
    category: "Outros",
    expiryDate: "2026-12-30",
    location: "Canoinhas - SC",
    description: "Temperada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-40",
    name: "Fubá",
    quantity: "18 kg",
    category: "Grãos",
    expiryDate: "2026-11-12",
    location: "Canoinhas - SC",
    description: "Moído fino",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-41",
    name: "Tapioca",
    quantity: "15 kg",
    category: "Grãos",
    expiryDate: "2026-10-08",
    location: "Canoinhas - SC",
    description: "Hidratada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-42",
    name: "Lentilha",
    quantity: "20 pacotes",
    category: "Grãos",
    expiryDate: "2027-01-18",
    location: "Canoinhas - SC",
    description: "500 g cada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-43",
    name: "Grão-de-bico",
    quantity: "20 pacotes",
    category: "Grãos",
    expiryDate: "2027-01-25",
    location: "Canoinhas - SC",
    description: "500 g cada",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-44",
    name: "Feijão Carioca",
    quantity: "24 kg",
    category: "Grãos",
    expiryDate: "2026-12-05",
    location: "Canoinhas - SC",
    description: "Saco fechado",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-45",
    name: "Arroz Parboilizado",
    quantity: "24 kg",
    category: "Grãos",
    expiryDate: "2026-12-20",
    location: "Canoinhas - SC",
    description: "Pacote fechado",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-46",
    name: "Lasanha Congelada",
    quantity: "24 unidades",
    category: "Outros",
    expiryDate: "2026-07-12",
    location: "Canoinhas - SC",
    description: "Bolonhesa",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-47",
    name: "Pizza Congelada",
    quantity: "30 unidades",
    category: "Outros",
    expiryDate: "2026-06-20",
    location: "Canoinhas - SC",
    description: "Mussarela",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-48",
    name: "Sorvete",
    quantity: "16 potes",
    category: "Outros",
    expiryDate: "2026-08-10",
    location: "Canoinhas - SC",
    description: "2 litros",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-49",
    name: "Peito de Peru",
    quantity: "8 kg",
    category: "Proteínas",
    expiryDate: "2026-03-14",
    location: "Canoinhas - SC",
    description: "Fatiado",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
  {
    id: "bruda-50",
    name: "Mix de Castanhas",
    quantity: "15 kg",
    category: "Outros",
    expiryDate: "2026-11-30",
    location: "Canoinhas - SC",
    description: "Embalado",
    donorId: "bruda-supermercados",
    donorName: "Bruda Supermercados",
    createdAt: "2026-02-05",
    status: "available",
  },
];

const normalizedMockProducts = mockAvailableProducts.map(normalizeLegacyProduct);

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState("donate");
  const [showLanding, setShowLanding] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [expandedReserveId, setExpandedReserveId] = useState(null);
  

  const [products, setProducts] = useState(() => {
    const saved = loadState();
    if (saved?.products?.length) {
      return mergeProducts(saved.products, normalizedMockProducts);
    }
    return normalizedMockProducts;
  });

  const [users, setUsers] = useState(() => {
    const saved = loadState();
    return saved?.users || {};
  });

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [requestAmounts, setRequestAmounts] = useState({});
  const [loginData, setLoginData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [isSignup, setIsSignup] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    stockAmount: "",
    unit: "kg",
    category: "",
    expiryDate: "",
    location: "",
    description: "",
    maxPerPerson: "",
    minRemainingAmount: "",
  });

  useEffect(() => {
    saveState({ products, user, users });
  }, [products, user, users]);

  const handleLogin = (e) => {
    e.preventDefault();
    const email = normalizeEmail(loginData.email);

    if (!email) {
      alert("Informe um email válido.");
      return;
    }

    const existingUser = users[email];
    const displayName = loginData.name || existingUser?.name || email.split("@")[0];

    const newUser = existingUser || {
      id: createUserId(email),
      name: displayName,
      email,
    };

    const updatedUser = { ...newUser, name: displayName };
    setUsers((prev) => ({ ...prev, [email]: updatedUser }));
    setUser(updatedUser);
    setShowLogin(false);
    setShowLanding(false);
    setLoginData({ name: "", email: "", password: "" });
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab("donate");
    setShowLanding(false);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!user) return;

    const stockAmount = clampPositiveNumber(formData.stockAmount);
    const maxPerPerson = clampPositiveNumber(formData.maxPerPerson);
    const minRemainingAmount = sanitizeNumber(formData.minRemainingAmount, 0);
    const step = getStepByUnit(formData.unit);

    const expiry = new Date(formData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    if (!stockAmount) {
      alert("Informe uma quantidade total válida.");
      return;
    }

    if (!Number.isFinite(minRemainingAmount) || minRemainingAmount < 0) {
      alert("Informe uma quantidade mínima restante válida.");
      return;
    }

    if (!maxPerPerson) {
      alert("Informe um limite por pessoa válido.");
      return;
    }

    if (expiry < today) {
      alert("A data de validade não pode estar no passado.");
      return;
    }

    if (maxPerPerson >= stockAmount) {
      alert("O limite por pessoa deve ser menor do que a quantidade total disponível.");
      return;
    }

    if (minRemainingAmount >= stockAmount) {
      alert("A quantidade mínima restante deve ser menor do que a quantidade total.");
      return;
    }

    if (stockAmount - maxPerPerson < minRemainingAmount) {
      alert("Com esse limite por pessoa, não sobra o mínimo exigido no estoque.");
      return;
    }

    const roundedStock = Number(stockAmount.toFixed(step === 0.5 ? 1 : 0));
    const roundedMax = Number(maxPerPerson.toFixed(step === 0.5 ? 1 : 0));
    const roundedMin = Number(minRemainingAmount.toFixed(step === 0.5 ? 1 : 0));

    const newProduct = {
      id: createId("product"),
      name: formData.name,
      stockAmount: roundedStock,
      unit: formData.unit,
      category: formData.category,
      expiryDate: formData.expiryDate,
      location: formData.location,
      description: formData.description,
      donorId: user.id,
      donorName: user.name,
      createdAt: new Date().toISOString(),
      status: "available",
      maxPerPerson: roundedMax,
      minRemainingAmount: roundedMin,
      requests: [],
      pickupsHistory: [],
    };

    setProducts((prev) => [newProduct, ...prev]);

    setFormData({
      name: "",
      stockAmount: "",
      unit: "kg",
      category: "",
      expiryDate: "",
      location: "",
      description: "",
      maxPerPerson: "",
      minRemainingAmount: "",
    });

    setShowForm(false);
  };

  const handleDeleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRequestProduct = (productId) => {
    if (!user) return;

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;

        const requestedAmount = sanitizeNumber(requestAmounts[productId], 0);
        const availableAmount = getAvailableAmount(product);
        const maxPerPerson = sanitizeNumber(product.maxPerPerson, 0);
        const minRemainingAmount = sanitizeNumber(product.minRemainingAmount, 0);

        if (product.donorId === user.id) {
          alert("Você não pode reservar o seu próprio produto.");
          return product;
        }

        if (requestedAmount <= 0) {
          alert("Escolha uma quantidade válida.");
          return product;
        }

        if (requestedAmount > maxPerPerson) {
          alert(
            `O limite por pessoa para este item é ${formatQuantity(maxPerPerson, product.unit)}.`
          );
          return product;
        }

        if (requestedAmount >= availableAmount) {
          alert("Não é permitido reservar todo o estoque disponível.");
          return product;
        }

        if (availableAmount - requestedAmount < minRemainingAmount) {
          alert(
            `É necessário deixar pelo menos ${formatQuantity(
              minRemainingAmount,
              product.unit
            )} no estoque.`
          );
          return product;
        }

        const existingReservedByUser = (product.requests || []).some(
          (request) =>
            request.userId === user.id &&
            request.status === "reserved"
        );

        if (existingReservedByUser) {
          alert("Você já possui uma reserva ativa para este produto.");
          return product;
        }

        const newRequest = {
          id: createId("req"),
          userId: user.id,
          userName: user.name,
          amount: requestedAmount,
          createdAt: new Date().toISOString(),
          status: "reserved",
        };

        return {
          ...product,
          requests: [...(product.requests || []), newRequest],
          status: "available",
        };
      })
    );

    setRequestAmounts((prev) => ({ ...prev, [productId]: "" }));
  };

  const handleCancelRequest = (productId, requestId) => {
    if (!user) return;

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;

        return {
          ...product,
          requests: (product.requests || []).map((request) => {
            if (request.id !== requestId) return request;
            if (request.userId !== user.id) return request;
            if (request.status !== "reserved") return request;

            return {
              ...request,
              status: "cancelled",
              cancelledAt: new Date().toISOString(),
            };
          }),
        };
      })
    );
  };

  const handleCompletePickup = (productId, requestId) => {
    if (!user) return;

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;

        const request = (product.requests || []).find((item) => item.id === requestId);
        if (!request) return product;
        if (request.status !== "reserved") return product;

        const isDonor = product.donorId === user.id;
        const isRequester = request.userId === user.id;

        if (!isDonor && !isRequester) return product;

        return {
          ...product,
          requests: (product.requests || []).map((item) =>
            item.id === requestId
              ? {
                  ...item,
                  status: "pickedUp",
                  pickedUpAt: new Date().toISOString(),
                }
              : item
          ),
          pickupsHistory: [
            ...(product.pickupsHistory || []),
            {
              requestId: request.id,
              userId: request.userId,
              userName: request.userName,
              amount: request.amount,
              pickedUpAt: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products]
  );

  const availableProducts = useMemo(() => {
    return products.filter((product) => {
      const availableAmount = getAvailableAmount(product);
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !categoryFilter || product.category === categoryFilter;

      return availableAmount > product.minRemainingAmount && matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const myProducts = user ? products.filter((p) => p.donorId === user.id) : [];

  const myReservedRequests = user
    ? products.flatMap((product) =>
        (product.requests || [])
          .filter((request) => request.userId === user.id && request.status === "reserved")
          .map((request) => ({ product, request }))
      )
    : [];

  const myPickedUp = user
    ? products.flatMap((product) =>
        (product.requests || [])
          .filter((request) => request.userId === user.id && request.status === "pickedUp")
          .map((request) => ({ product, request }))
      )
    : [];

  const myDonorReserved = user
    ? myProducts.flatMap((product) =>
        (product.requests || [])
          .filter((request) => request.status === "reserved")
          .map((request) => ({ product, request }))
      )
    : [];

  const myDonationsPickedUp = user
    ? myProducts.flatMap((product) =>
        (product.requests || [])
          .filter((request) => request.status === "pickedUp")
          .map((request) => ({ product, request }))
      )
    : [];

  if (!user || showLanding) {
    return (
      <div className="min-h-screen">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">💚</span>
              <h1 className="text-2xl font-bold text-green-600">Salve Comida</h1>
            </div>

            {user ? (
              <button
                onClick={() => setShowLanding(false)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Voltar ao App
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Entrar
              </button>
            )}
          </div>
        </header>

        <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Transforme Excedente em Solidariedade
              </h2>
              <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
                Conectamos quem tem alimentos para doar com quem precisa receber. Juntos, reduzimos
                o desperdício e combatemos a fome.
              </p>
              <button
                onClick={() => setShowLogin(true)}
                className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-green-700 transition-colors shadow-lg"
              >
                Começar Agora
              </button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Como Funciona</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🍽️</span>
                </div>
                <h4 className="text-xl font-semibold mb-3">Doe Alimentos</h4>
                <p className="text-gray-600">
                  Cadastre alimentos que você tem disponível para doação. Agora com quantidade
                  total, limite por pessoa e estoque mínimo.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤝</span>
                </div>
                <h4 className="text-xl font-semibold mb-3">Reserve Uma Parte</h4>
                <p className="text-gray-600">
                  O recebedor pode escolher quanto precisa, sem precisar retirar todo o estoque.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌱</span>
                </div>
                <h4 className="text-xl font-semibold mb-3">Faça a Diferença</h4>
                <p className="text-gray-600">
                  Contribua para um mundo mais sustentável e justo. Cada retirada conta.
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => setShowTerms(true)}
                className="text-green-700 hover:text-green-800 text-sm"
              >
                Ver regras básicas e termos
              </button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-green-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">1,234</div>
                <div className="text-green-100">Doações Realizadas</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">567</div>
                <div className="text-green-100">Usuários Ativos</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">2,456 kg</div>
                <div className="text-green-100">Alimentos Salvos</div>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-gray-900 text-gray-300 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; 2026 Salve Comida. Todos os direitos reservados.</p>
          </div>
        </footer>

        {showLogin && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isSignup ? "Criar Conta" : "Entrar"}
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                {isSignup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={loginData.name}
                      onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {isSignup ? "Criar Conta" : "Entrar"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-green-600 hover:text-green-700 text-sm"
                >
                  {isSignup ? "Já tem conta? Entrar" : "Não tem conta? Criar conta"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showTerms && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 relative">
              <button
                onClick={() => setShowTerms(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Regras Básicas e Termos</h2>
              <ul className="text-sm text-gray-700 space-y-3 list-disc pl-5">
                <li>Somente alimentos dentro da validade e em boas condições de higiene.</li>
                <li>Produtos perecíveis devem estar refrigerados e bem embalados.</li>
                <li>O doador é responsável pela veracidade das informações do produto.</li>
                <li>O recebedor deve combinar retirada em local público e seguro.</li>
                <li>Não é permitido reservar todo o estoque disponível de uma vez.</li>
                <li>Todo produto possui limite por pessoa e estoque mínimo restante.</li>
              </ul>
              <div className="mt-6 text-right">
                <button
                  onClick={() => setShowTerms(false)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">💚</span>
              <h1 className="text-2xl font-bold text-green-600">Salve Comida</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-gray-700">Olá, {user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>

              <button
                onClick={() => setActiveTab("donate")}
                className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded"
              >
                Início
              </button>

              <button
                onClick={() => setShowLanding(true)}
                className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded"
              >
                Home
              </button>

              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("donate")}
              className={`py-4 px-2 border-b-2 font-medium flex items-center gap-2 ${
                activeTab === "donate"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-xl">➕</span>
              Doar Produtos
            </button>

            <button
              onClick={() => setActiveTab("receive")}
              className={`py-4 px-2 border-b-2 font-medium flex items-center gap-2 ${
                activeTab === "receive"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-xl">📦</span>
              Receber Produtos
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-2 border-b-2 font-medium flex items-center gap-2 ${
                activeTab === "profile"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-xl">👤</span>
              Meu Perfil
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "donate" ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Meus Produtos para Doação</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>➕</span>
                Adicionar Produto
              </button>
            </div>

            {myDonorReserved.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Pedidos Recebidos</h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myDonorReserved.map(({ product, request }) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">
                            Reservado por: {request.userName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantidade: {formatQuantity(request.amount, product.unit)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Em: {new Date(request.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <span className="text-yellow-600 font-medium text-sm">Reservado</span>
                      </div>

                      <button
                        onClick={() => handleCompletePickup(product.id, request.id)}
                        className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Confirmar Retirada
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myDonationsPickedUp.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Histórico de Doações Finalizadas</h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myDonationsPickedUp.map(({ product, request }) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">Retirado por: {request.userName}</p>
                          <p className="text-sm text-gray-600">
                            Quantidade: {formatQuantity(request.amount, product.unit)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Em:{" "}
                            {request.pickedUpAt
                              ? new Date(request.pickedUpAt).toLocaleString("pt-BR")
                              : "-"}
                          </p>
                        </div>
                        <span className="text-green-600 font-medium text-sm">Finalizado</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Novo Produto</h3>

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Produto *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade Total *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step={getStepByUnit(formData.unit)}
                        value={formData.stockAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, stockAmount: e.target.value })
                        }
                        placeholder="Ex: 20"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidade *
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="kg">kg</option>
                        <option value="litros">litros</option>
                        <option value="unidades">unidades</option>
                        <option value="pacotes">pacotes</option>
                        <option value="latas">latas</option>
                        <option value="garrafas">garrafas</option>
                        <option value="potes">potes</option>
                        <option value="dúzias">dúzias</option>
                        <option value="sachês">sachês</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="Grãos">Grãos</option>
                        <option value="Frutas">Frutas</option>
                        <option value="Vegetais">Vegetais</option>
                        <option value="Laticínios">Laticínios</option>
                        <option value="Proteínas">Proteínas</option>
                        <option value="Enlatados">Enlatados</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Limite por Pessoa *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step={getStepByUnit(formData.unit)}
                        value={formData.maxPerPerson}
                        onChange={(e) =>
                          setFormData({ ...formData, maxPerPerson: e.target.value })
                        }
                        placeholder="Ex: 5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estoque Mínimo Restante *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step={getStepByUnit(formData.unit)}
                        value={formData.minRemainingAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, minRemainingAmount: e.target.value })
                        }
                        placeholder="Ex: 1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Validade *
                      </label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Localização *
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Ex: São Paulo, SP"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Informações adicionais sobre o produto..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {myProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500">Você ainda não adicionou produtos para doação.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Clique em "Adicionar Produto" para começar a doar.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProducts.map((product) => {
                  const availableAmount = getAvailableAmount(product);
                  const reservedAmount = sumReservedAmount(product);
                  const pickedUpAmount = sumPickedUpAmount(product);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-md p-4 card-hover"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                            {product.category}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-500 hover:text-red-700 text-xl"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Total:</span>{" "}
                          {formatQuantity(product.stockAmount, product.unit)}
                        </p>
                        <p>
                          <span className="font-medium">Disponível:</span>{" "}
                          {formatQuantity(availableAmount, product.unit)}
                        </p>
                        <p>
                          <span className="font-medium">Reservado:</span>{" "}
                          {formatQuantity(reservedAmount, product.unit)}
                        </p>
                        <p>
                          <span className="font-medium">Retirado:</span>{" "}
                          {formatQuantity(pickedUpAmount, product.unit)}
                        </p>
                        <p>
                          <span className="font-medium">Limite por pessoa:</span>{" "}
                          {formatQuantity(product.maxPerPerson, product.unit)}
                        </p>
                        <p>
                          <span className="font-medium">Mínimo no estoque:</span>{" "}
                          {formatQuantity(product.minRemainingAmount, product.unit)}
                        </p>
                        <p>
                          <span className="font-medium">Validade:</span>{" "}
                          {new Date(product.expiryDate).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="flex items-center gap-1">📍 {product.location}</p>
                        {product.description && (
                          <p className="text-gray-500 mt-2">{product.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "receive" ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Produtos Disponíveis</h2>

            {myReservedRequests.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Meus Pedidos</h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myReservedRequests.map(({ product, request }) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">Doador: {product.donorName}</p>
                          <p className="text-sm text-gray-600">
                            Quantidade: {formatQuantity(request.amount, product.unit)}
                          </p>
                          <p className="text-sm text-gray-600">📍 {product.location}</p>
                          <p className="text-xs text-gray-500">
                            Reservado em: {new Date(request.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <span className="text-yellow-600 font-medium text-sm">Reservado</span>
                      </div>

                      <button
                        onClick={() => handleCompletePickup(product.id, request.id)}
                        className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Finalizar Retirada
                      </button>

                      <button
                        onClick={() => handleCancelRequest(product.id, request.id)}
                        className="mt-2 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancelar Reserva
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myPickedUp.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Histórico de Retiradas</h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myPickedUp.map(({ product, request }) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">Doador: {product.donorName}</p>
                          <p className="text-sm text-gray-600">
                            Quantidade: {formatQuantity(request.amount, product.unit)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Em:{" "}
                            {request.pickedUpAt
                              ? new Date(request.pickedUpAt).toLocaleString("pt-BR")
                              : "-"}
                          </p>
                        </div>
                        <span className="text-green-600 font-medium text-sm">Finalizado</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Buscar por nome ou descrição..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {availableProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProducts.map((product) => {
                  const availableAmount = getAvailableAmount(product);
                  const maxSelectable = Math.max(
                    0,
                    Math.min(
                      availableAmount - product.minRemainingAmount,
                      product.maxPerPerson
                    )
                  );

                  const userAlreadyReserved = (product.requests || []).some(
                    (request) =>
                      request.userId === user.id && request.status === "reserved"
                  );

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-md p-4 card-hover"
                    >
                      <div className="mb-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                        </div>

                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                          {product.category}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p>
                          <span className="font-medium">Disponível:</span>{" "}
                          {formatQuantity(availableAmount, product.unit)}
                        </p>
                        <p>
                          <span className="font-medium">Limite por pessoa:</span>{" "}
                          {formatQuantity(product.maxPerPerson, product.unit)}
                        </p>
                        <p>
                          <span className="font-medium">Deve restar no estoque:</span>{" "}
                          {formatQuantity(product.minRemainingAmount, product.unit)}
                        </p>
                        <p>
                          <span className="font-medium">Validade:</span>{" "}
                          {new Date(product.expiryDate).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="flex items-center gap-1">📍 {product.location}</p>
                        <p>
                          <span className="font-medium">Doador:</span> {product.donorName}
                        </p>
                        {product.description && (
                          <p className="text-gray-500 mt-2">{product.description}</p>
                        )}
                      </div>

                      <div className="mt-4">
                        {expandedReserveId === product.id ? (
                          <div className="border rounded-lg p-3 bg-gray-50">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantidade para reservar
                            </label>

                            <input
                              type="number"
                              min="0"
                              step={getStepByUnit(product.unit)}
                              max={maxSelectable}
                              value={requestAmounts[product.id] || ""}
                              onChange={(e) =>
                                setRequestAmounts((prev) => ({
                                  ...prev,
                                  [product.id]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder={
                                maxSelectable > 0
                                  ? `Máximo: ${formatQuantity(maxSelectable, product.unit)}`
                                  : "Indisponível"
                              }
                            />

                            <p className="text-xs text-gray-500 mt-2">
                              Limite por pessoa: {formatQuantity(product.maxPerPerson, product.unit)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Deve restar no estoque: {formatQuantity(product.minRemainingAmount, product.unit)}
                            </p>

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => {
                                  handleRequestProduct(product.id);
                                  setExpandedReserveId(null);
                                }}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Confirmar Reserva
                              </button>

                              <button
                                onClick={() => {
                                  setExpandedReserveId(null);
                                  setRequestAmounts((prev) => ({
                                    ...prev,
                                    [product.id]: "",
                                  }));
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setExpandedReserveId(product.id)}
                            disabled={
                              userAlreadyReserved || user.id === product.donorId || maxSelectable <= 0
                            }
                            className={`w-full py-2 rounded-lg transition-colors ${
                              userAlreadyReserved || user.id === product.donorId || maxSelectable <= 0
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            {user.id === product.donorId
                              ? "Seu produto"
                              : userAlreadyReserved
                              ? "Você já reservou"
                              : maxSelectable <= 0
                              ? "Indisponível"
                              : "Reservar"}
                          </button>
                        )}
                      </div>                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h2>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Meus Dados</h3>
              <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Produtos doados</p>
                  <p className="font-medium">{myProducts.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pedidos realizados</p>
                  <p className="font-medium">{myReservedRequests.length + myPickedUp.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Produtos que Doei</h3>

              {myProducts.length === 0 ? (
                <p className="text-gray-500">Você ainda não doou nenhum produto.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{product.name}</h4>
                        <span className="text-xs text-gray-500">
                          {formatQuantity(getAvailableAmount(product), product.unit)} disponíveis
                        </span>
                      </div>

                      <p className="text-sm text-gray-600">
                        Total: {formatQuantity(product.stockAmount, product.unit)}
                      </p>
                      <p className="text-sm text-gray-600">📍 {product.location}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Validade: {new Date(product.expiryDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Produtos que Solicitei</h3>

              {myReservedRequests.length === 0 && myPickedUp.length === 0 ? (
                <p className="text-gray-500">Você ainda não solicitou nenhum produto.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...myReservedRequests, ...myPickedUp].map(({ product, request }) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{product.name}</h4>
                        <span className="text-xs text-gray-500">{request.status}</span>
                      </div>
                      <p className="text-sm text-gray-600">Doador: {product.donorName}</p>
                      <p className="text-sm text-gray-600">
                        Quantidade: {formatQuantity(request.amount, product.unit)}
                      </p>
                      <p className="text-sm text-gray-600">📍 {product.location}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Validade: {new Date(product.expiryDate).toLocaleDateString("pt-BR")}
                      </p>

                      {request.status === "reserved" && (
                        <button
                          onClick={() => handleCancelRequest(product.id, request.id)}
                          className="mt-3 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancelar Reserva
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Elemento "root" não encontrado no HTML.');
}

ReactDOM.createRoot(rootElement).render(<App />);