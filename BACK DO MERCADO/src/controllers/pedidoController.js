const prisma = require('../config/prisma');

const pedidoController = {
    criar: async (req, res) => {
        const { nomeCliente, telefone, total, itens, endereco, formaEntrega, formaPagamento } = req.body;
        try {
            const novoPedido = await prisma.pedido.create({
                data: { nomeCliente, telefone, total: parseFloat(total), itens, endereco, formaEntrega, formaPagamento }
            });
            res.json({ mensagem: "Pedido realizado com sucesso!", pedido: novoPedido });
        } catch (erro) {
            console.error(erro);
            res.status(500).json({ mensagem: "Erro ao criar pedido" });
        }
    },

    listarTodos: async (req, res) => {
        try {
            const pedidos = await prisma.pedido.findMany({ orderBy: { id: 'desc' } });
            res.json(pedidos);
        } catch (erro) {
            console.error("Erro ao buscar pedidos:", erro);
            res.status(500).json({ mensagem: "Erro ao buscar pedidos" });
        }
    },

    buscarPorId: async (req, res) => {
        const id = parseInt(req.params.id);
        try {
            const pedido = await prisma.pedido.findUnique({ where: { id } });
            if (!pedido) return res.status(404).json({ mensagem: "Pedido não encontrado!" });
            res.json(pedido);
        } catch (erro) {
            console.error("Erro ao buscar pedido:", erro);
            res.status(500).json({ mensagem: "Erro ao buscar pedido." });
        }
    },

    editar: async (req, res) => {
        const idParaEditar = parseInt(req.params.id);
        const { nomeCliente, telefone, total, itens, endereco, formaEntrega, formaPagamento, status } = req.body;
        try {
            const dados = {};
            if (nomeCliente !== undefined) dados.nomeCliente = nomeCliente;
            if (telefone !== undefined) dados.telefone = telefone;
            if (total !== undefined) dados.total = parseFloat(total);
            if (itens !== undefined) dados.itens = itens;
            if (endereco !== undefined) dados.endereco = endereco;
            if (formaEntrega !== undefined) dados.formaEntrega = formaEntrega;
            if (formaPagamento !== undefined) dados.formaPagamento = formaPagamento;
            if (status !== undefined) dados.status = status;

            const pedidoAtualizado = await prisma.pedido.update({
                where: { id: idParaEditar },
                data: dados
            });
            console.log(`✏️ Pedido ID ${idParaEditar} atualizado.`);
            res.json({ mensagem: "Pedido atualizado com sucesso!", pedido: pedidoAtualizado });
        } catch (erro) {
            res.status(404).json({ mensagem: "Pedido não encontrado para editar!" });
        }
    }
};

module.exports = pedidoController;