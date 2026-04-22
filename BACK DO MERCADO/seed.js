const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const produtosOriginais = [
  { nome: "Feijão Carioca Turquesa 1KG", preco: 7.49, categoria: "Mercearia", tipo: "und" },
  { nome: "Feijão Preto Camil 1KG", preco: 5.99, categoria: "Mercearia", tipo: "und" },
  { nome: "Refresco Em Pó Tang 25G", preco: 1.25, categoria: "Mercearia", tipo: "und" },
  { nome: "Queijo Mussarela KG", preco: 33.99, categoria: "Frios", tipo: "kg" },
  { nome: "Presunto KG", preco: 24.99, categoria: "Frios", tipo: "kg" },
  { nome: "Ovos", preco: 0.70, categoria: "Hortifruti", tipo: "und" },
  { nome: "Biscoito Treloso 130G", preco: 1.99, categoria: "Bomboniere", tipo: "und" },
  { nome: "Pippos 30G", preco: 1.99, categoria: "Bomboniere", tipo: "und" },
  { nome: "Mistura Láctea Condensada Triangulo 395G", preco: 3.99, categoria: "PROMOÇÃO", tipo: "und" },
  { nome: "Leite Condensado Natville 395G", preco: 5.99, categoria: "PROMOÇÃO", tipo: "und" },
  { nome: "Copo Descartavel CristalCopo", preco: 2.49, categoria: "Embalagens", tipo: "und" },
  { nome: "Prato Descartavel Raso CristalCopo", preco: 1.49, categoria: "Embalagens", tipo: "und" }
];

async function popularBanco() {
  console.log("Iniciando a inserção dos produtos no MySQL...");
  
  for (const p of produtosOriginais) {
    await prisma.produto.create({
      data: {
        nome: p.nome,
        preco: p.preco,
        categoria: p.categoria,
        tipo: p.tipo,
        ativo: 1
      }
    });
  }
  
  console.log("✅ Sucesso! Todos os produtos foram inseridos no banco de dados.");
}

popularBanco()
  .catch(erro => console.error("Erro ao popular banco:", erro))
  .finally(async () => {
    await prisma.$disconnect();
  });