const prisma = require('../config/prisma');

const produtoController = {
    listarTodos: async (req, res) => {
        try {
            const produtos = await prisma.produto.findMany();
            res.json(produtos);
        } catch (erro) {
            console.error("Erro ao buscar produtos:", erro);
            res.status(500).json({ mensagem: "Erro interno no servidor" });
        }
    },

    criar: async (req, res) => {
        const { nome, preco, categoria, tipo, promocao, preco_promocao, qtd_promocao } = req.body;
        if (!nome || preco === undefined) {
            return res.status(400).json({ mensagem: "Nome e preço são obrigatórios!" });
        }
        try {
            const novoProduto = await prisma.produto.create({
                data: { 
                    nome, 
                    preco: parseFloat(preco), 
                    categoria: categoria || null, 
                    tipo: tipo || "und",
                    // ★ AQUI A PROMOÇÃO É SALVA DE VERDADE ★
                    promocao: promocao === true || promocao === 1 ? true : false,
                    preco_promocao: promocao && preco_promocao ? parseFloat(preco_promocao) : null,
                    qtd_promocao: promocao && qtd_promocao ? parseInt(qtd_promocao) : 1
                }
            });
            console.log("✅ Produto salvo:", novoProduto);
            res.status(201).json({ mensagem: "Produto salvo com sucesso!", produto: novoProduto });
        } catch (erro) {
            console.error("Erro ao salvar produto:", erro);
            res.status(500).json({ mensagem: "Erro ao salvar no banco de dados" });
        }
    },

    deletar: async (req, res) => {
        const idParaDeletar = parseInt(req.params.id);
        try {
            await prisma.produto.delete({ where: { id: idParaDeletar } });
            console.log(`🗑️ Produto ID ${idParaDeletar} removido.`);
            res.json({ mensagem: "Produto removido com sucesso!" });
        } catch (erro) {
            res.status(404).json({ mensagem: "Produto não encontrado para deletar!" });
        }
    },

    editar: async (req, res) => {
        const id = parseInt(req.params.id);
        const { nome, preco, categoria, tipo, promocao, preco_promocao, qtd_promocao } = req.body;
        try {
            const dados = {};
            if (nome !== undefined) dados.nome = nome;
            if (preco !== undefined) dados.preco = parseFloat(preco);
            if (categoria !== undefined) dados.categoria = categoria;
            if (tipo !== undefined) dados.tipo = tipo;
            
            // ★ AQUI A PROMOÇÃO É ATUALIZADA DE VERDADE ★
            if (promocao !== undefined) dados.promocao = promocao === true || promocao === 1 ? true : false;
            if (preco_promocao !== undefined) dados.preco_promocao = promocao ? parseFloat(preco_promocao) : null;
            if (qtd_promocao !== undefined) dados.qtd_promocao = promocao ? parseInt(qtd_promocao) : 1;

            const atualizado = await prisma.produto.update({ where: { id }, data: dados });
            res.json({ mensagem: "Produto atualizado!", produto: atualizado });
        } catch (erro) {
            console.error("Erro ao atualizar:", erro);
            res.status(404).json({ mensagem: "Produto não encontrado!" });
        }
    }
};

module.exports = produtoController;