const prisma = require('../config/prisma');

const authController = {
    cadastrar: async (req, res) => {
        const { nome, email, senha } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: "Todos os campos são obrigatórios!" });
        }
        try {
            const usuarioExiste = await prisma.usuario.findUnique({ where: { email } });
            if (usuarioExiste) {
                return res.status(400).json({ mensagem: "Este e-mail já está cadastrado!" });
            }
            const novoUsuario = await prisma.usuario.create({
                data: { nome, email, senha, papel: "USER" }
            });
            console.log("👤 Novo usuário cadastrado:", novoUsuario.nome);
            res.status(201).json({ mensagem: "Cadastro realizado com sucesso!" });
        } catch (erro) {
            console.error("Erro no cadastro:", erro);
            res.status(500).json({ mensagem: "Erro ao cadastrar usuário." });
        }
    },

    login: async (req, res) => {
        const { email, senha } = req.body;
        try {
            const usuario = await prisma.usuario.findUnique({ where: { email } });
            if (!usuario || usuario.senha !== senha) {
                return res.status(401).json({ mensagem: "E-mail ou senha incorretos!" });
            }
            console.log(`🔑 Login efetuado: ${usuario.nome} (${usuario.papel})`);
            res.json({
                mensagem: "Login efetuado com sucesso!",
                usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel }
            });
        } catch (erro) {
            console.error("Erro no login:", erro);
            res.status(500).json({ mensagem: "Erro interno no servidor." });
        }
    }
};

module.exports = authController;