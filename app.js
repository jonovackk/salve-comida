const { useEffect, useState } = React;

/** Persistência (localStorage) **/
const STORAGE_KEY = "salvecomida:v1";

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
  return email.trim().toLowerCase();
}

function createUserId(email) {
  const normalized = normalizeEmail(email);
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return `user_${hash.toString(36)}`;
}

// Mock data (com status)
const mockAvailableProducts = [
  {
    id: "1",
    name: "Arroz Branco",
    quantity: "20 kg",
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
    quantity: "5 kg",
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
    quantity: "12 pacotes",
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
    quantity: "10 kg",
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
    quantity: "6 litros",
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
    quantity: "8 kg",
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
    quantity: "4 kg",
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
    quantity: "5 pacotes",
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
    quantity: "3 kg",
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
    quantity: "2 kg",
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
    quantity: "1,5 kg",
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
    quantity: "10 pacotes",
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
    quantity: "6 dúzias",
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
    quantity: "6 kg",
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
    quantity: "20 unidades",
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
    quantity: "8 kg",
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
    quantity: "2 kg",
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
    quantity: "12 kg",
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
    quantity: "15 kg",
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
    quantity: "20 dúzias",
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
    quantity: "18 unidades",
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
    quantity: "24 potes",
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
    quantity: "3 kg",
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
    quantity: "12 potes",
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
    quantity: "6 kg",
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
    quantity: "8 kg",
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
    quantity: "5 kg",
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
    quantity: "24 latas",
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
    quantity: "30 latas",
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
    quantity: "24 latas",
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
    quantity: "24 latas",
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
    quantity: "18 sachês",
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
    quantity: "20 pacotes",
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
    quantity: "30 pacotes",
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
    quantity: "8 pacotes",
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
    quantity: "6 pacotes",
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
    quantity: "12 litros",
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
    quantity: "24 garrafas",
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
    quantity: "12 garrafas",
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
    quantity: "10 pacotes",
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
    quantity: "6 kg",
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
    quantity: "5 kg",
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
    quantity: "8 pacotes",
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
    quantity: "8 pacotes",
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
    quantity: "12 kg",
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
    quantity: "10 kg",
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
    quantity: "12 unidades",
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
    quantity: "15 unidades",
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
    quantity: "8 potes",
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
    quantity: "2 kg",
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
    quantity: "5 kg",
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

function mergeProducts(primary, fallback) {
  const byId = new Map();
  primary.forEach((product) => byId.set(product.id, product));
  fallback.forEach((product) => {
    if (!byId.has(product.id)) byId.set(product.id, product);
  });
  return Array.from(byId.values());
}

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState("donate"); // 'donate' | 'receive' | 'profile'
  const [showLanding, setShowLanding] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // products agora carrega do localStorage (se existir) senão usa o mock
  const [products, setProducts] = useState(() => {
    const saved = loadState();
    if (saved?.products?.length) {
      return mergeProducts(saved.products, mockAvailableProducts);
    }
    return mockAvailableProducts;
  });

  const [users, setUsers] = useState(() => {
    const saved = loadState();
    return saved?.users || {};
  });

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [loginData, setLoginData] = useState({ name: "", email: "", password: "" });
  const [isSignup, setIsSignup] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    category: "",
    expiryDate: "",
    location: "",
    description: "",
  });

  // Auto-save
  useEffect(() => {
    saveState({ products, user, users });
  }, [products, user, users]);

  const handleLogin = (e) => {
    e.preventDefault();
    const email = normalizeEmail(loginData.email);
    const existingUser = users[email];
    const displayName = loginData.name || existingUser?.name || email.split("@")[0];
    const newUser = existingUser || {
      id: createUserId(email),
      name: displayName,
      email,
    };

    const updatedUser = { ...newUser, name: displayName };
    setUsers({ ...users, [email]: updatedUser });
    setUser(updatedUser);
    setShowLogin(false);
    setShowLanding(false);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab("donate");
    setShowLanding(false);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!user) return;

    // Validação mínima: validade não pode ser no passado
    const expiry = new Date(formData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    if (expiry < today) {
      alert("A data de validade não pode estar no passado.");
      return;
    }

    const newProduct = {
      id: Math.random().toString(36).slice(2, 11),
      ...formData,
      donorId: user.id,
      donorName: user.name,
      createdAt: new Date().toISOString(),
      status: "available",
    };

    setProducts((prev) => [...prev, newProduct]);

    setFormData({
      name: "",
      quantity: "",
      category: "",
      expiryDate: "",
      location: "",
      description: "",
    });
    setShowForm(false);
  };

  const handleDeleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Reservar (grava no próprio produto)
  const handleRequestProduct = (productId) => {
    if (!user) return;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        if (p.status !== "available") return p;

        return {
          ...p,
          status: "reserved",
          requestedById: user.id,
          requestedByName: user.name,
          requestedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Finalizar retirada (reserved -> pickedUp)
  const handleCompletePickup = (productId) => {
    if (!user) return;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;

        const isDonor = p.donorId === user.id;
        const isRequester = p.requestedById === user.id;

        if (!isDonor && !isRequester) return p;
        if (p.status !== "reserved") return p;

        return {
          ...p,
          status: "pickedUp",
          pickedUpAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleCancelRequest = (productId) => {
    if (!user) return;

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        if (product.status !== "reserved") return product;
        if (product.requestedById !== user.id) return product;

        return {
          ...product,
          status: "available",
          requestedById: undefined,
          requestedByName: undefined,
          requestedAt: undefined,
        };
      })
    );
  };

  // Dados derivados
  const myProducts = user ? products.filter((p) => p.donorId === user.id) : [];

  const myReservedRequests = user
    ? products.filter((p) => p.status === "reserved" && p.requestedById === user.id)
    : [];

  const myDonorReserved = user
    ? products.filter((p) => p.status === "reserved" && p.donorId === user.id)
    : [];

  const myPickedUp = user
    ? products.filter((p) => p.status === "pickedUp" && p.requestedById === user.id)
    : [];

  const myDonationsPickedUp = user
    ? products.filter((p) => p.status === "pickedUp" && p.donorId === user.id)
    : [];

  // Receber: só disponíveis
  const availableProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoryFilter || product.category === categoryFilter;

    return product.status === "available" && matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Landing
  if (!user || showLanding) {
    return (
      <div className="min-h-screen">
        {/* Header */}
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

        {/* Hero */}
        <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Transforme Excedente em Solidariedade
              </h2>
              <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
                Conectamos quem tem alimentos para doar com quem precisa receber. Juntos, reduzimos o desperdício e combatemos a fome.
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

        {/* Features */}
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
                  Cadastre alimentos que você tem disponível para doação. Ajude a reduzir o desperdício.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤝</span>
                </div>
                <h4 className="text-xl font-semibold mb-3">Conecte-se</h4>
                <p className="text-gray-600">
                  Encontre doadores e recebedores em sua região. Construa uma comunidade solidária.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌱</span>
                </div>
                <h4 className="text-xl font-semibold mb-3">Faça a Diferença</h4>
                <p className="text-gray-600">
                  Contribua para um mundo mais sustentável e justo. Cada doação conta.
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

        {/* Stats */}
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

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; 2026 Salve Comida. Todos os direitos reservados.</p>
          </div>
        </footer>

        {/* Login Modal */}
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
                <li>Em caso de dúvidas, use o contato informado no chat/descrição.</li>
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

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">💚</span>
              <h1 className="text-2xl font-bold text-green-600">Salve Comida</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Perfil simples */}
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

      {/* Tabs */}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "donate" ? (
          /* Donate Tab */
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

            {/* Pedidos recebidos (itens seus reservados por alguém) */}
            {myDonorReserved.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Pedidos Recebidos</h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myDonorReserved.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">
                            Reservado por: {product.requestedByName || "alguém"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Em:{" "}
                            {product.requestedAt
                              ? new Date(product.requestedAt).toLocaleString("pt-BR")
                              : "-"}
                          </p>
                        </div>
                        <span className="text-yellow-600 font-medium text-sm">Reservado</span>
                      </div>

                      <button
                        onClick={() => handleCompletePickup(product.id)}
                        className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Confirmar Retirada (Finalizar)
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
                  {myDonationsPickedUp.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">
                            Retirado por: {product.requestedByName || "alguém"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Em: {product.pickedUpAt ? new Date(product.pickedUpAt).toLocaleString("pt-BR") : "-"}
                          </p>
                        </div>
                        <span className="text-green-600 font-medium text-sm">Finalizado</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Product Form */}
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
                        Quantidade *
                      </label>
                      <input
                        type="text"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="Ex: 2 kg, 5 unidades"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
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

                    <div>
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
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

            {/* Products List */}
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
                {myProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md p-4 card-hover">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                          {product.category}
                        </span>

                        {product.status === "reserved" && (
                          <span className="block text-xs text-yellow-700 mt-2">
                            Reservado por: {product.requestedByName || "alguém"}
                          </span>
                        )}
                        {product.status === "pickedUp" && (
                          <span className="block text-xs text-gray-600 mt-2">
                            Retirado em:{" "}
                            {product.pickedUpAt
                              ? new Date(product.pickedUpAt).toLocaleString("pt-BR")
                              : "-"}
                          </span>
                        )}
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
                        <span className="font-medium">Quantidade:</span> {product.quantity}
                      </p>
                      <p>
                        <span className="font-medium">Validade:</span>{" "}
                        {new Date(product.expiryDate).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="flex items-center gap-1">📍 {product.location}</p>
                      {product.description && <p className="text-gray-500 mt-2">{product.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "receive" ? (
          /* Receive Tab */
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Produtos Disponíveis</h2>

            {/* Meus Pedidos (itens que EU reservei) */}
            {myReservedRequests.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Meus Pedidos</h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myReservedRequests.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">Doador: {product.donorName}</p>
                          <p className="text-sm text-gray-600">📍 {product.location}</p>
                          <p className="text-xs text-gray-500">
                            Reservado em:{" "}
                            {product.requestedAt
                              ? new Date(product.requestedAt).toLocaleString("pt-BR")
                              : "-"}
                          </p>
                        </div>
                        <span className="text-yellow-600 font-medium text-sm">Reservado</span>
                      </div>

                      <button
                        onClick={() => handleCompletePickup(product.id)}
                        className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Finalizar Retirada
                      </button>

                      <button
                        onClick={() => handleCancelRequest(product.id)}
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
                  {myPickedUp.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">Doador: {product.donorName}</p>
                          <p className="text-xs text-gray-500">
                            Em: {product.pickedUpAt ? new Date(product.pickedUpAt).toLocaleString("pt-BR") : "-"}
                          </p>
                        </div>
                        <span className="text-green-600 font-medium text-sm">Finalizado</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
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

            {/* Products Grid */}
            {availableProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md p-4 card-hover">
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
                        <span className="font-medium">Quantidade:</span> {product.quantity}
                      </p>
                      <p>
                        <span className="font-medium">Validade:</span>{" "}
                        {new Date(product.expiryDate).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="flex items-center gap-1">📍 {product.location}</p>
                      <p>
                        <span className="font-medium">Doador:</span> {product.donorName}
                      </p>
                      {product.description && <p className="text-gray-500 mt-2">{product.description}</p>}
                    </div>

                    <button
                      onClick={() => handleRequestProduct(product.id)}
                      disabled={product.status !== "available"}
                      className={`w-full py-2 rounded-lg transition-colors ${
                        product.status !== "available"
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {product.status !== "available" ? "Indisponível" : "Reservar"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Profile Tab */
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
                  <p className="text-sm text-gray-500">Produtos solicitados</p>
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
                        <span className="text-xs text-gray-500">{product.status}</span>
                      </div>
                      <p className="text-sm text-gray-600">{product.quantity}</p>
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
                  {[...myReservedRequests, ...myPickedUp].map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{product.name}</h4>
                        <span className="text-xs text-gray-500">{product.status}</span>
                      </div>
                      <p className="text-sm text-gray-600">Doador: {product.donorName}</p>
                      <p className="text-sm text-gray-600">📍 {product.location}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Validade: {new Date(product.expiryDate).toLocaleDateString("pt-BR")}
                      </p>
                      {product.status === "reserved" && product.requestedById === user.id && (
                        <button
                          onClick={() => handleCancelRequest(product.id)}
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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
