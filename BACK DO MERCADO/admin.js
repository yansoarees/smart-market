const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function criarAdmin() {
  try {
    const admin = await prisma.usuario.create({
      data: {
        nome: "Yan (Dono)",
        email: "admin@mercado.com",
        senha: "123", // Senha simples apenas para os teus testes
        papel: "ADMIN"
      }
    });
    console.log("✅ Utilizador ADMIN criado com sucesso:", admin.email);
  } catch (erro) {
    console.log("❌ Erro ao criar:", erro.message);
  } finally {
    await prisma.$disconnect();
  }
}

criarAdmin();