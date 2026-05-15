const db = require('../../db');

class ProdutoRepository {
    async buscarTodos() {
        const [rows] = await db.query("SELECT * FROM produto ORDER BY id DESC");
        return rows;
    }

    async buscarPorId(id) {
        const [rows] = await db.query("SELECT * FROM produto WHERE id = ?", [id]);
        return rows[0];
    }

    async criar(dados) {
        const { nome, categoria, preco, promocao, preco_promocao, qtd_promocao, imagem, estoque, variacoes } = dados;
        const sql = "INSERT INTO produto (nome, categoria, preco, promocao, preco_promocao, qtd_promocao, ativo, imagem, estoque, variacoes) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)";
        const [result] = await db.query(sql, [nome, categoria, preco, promocao, preco_promocao, qtd_promocao, imagem, estoque || 0, variacoes || '[]']);
        return result.insertId;
    }

    async atualizar(id, dados) {
        const { nome, categoria, preco, promocao, preco_promocao, qtd_promocao, imagem, estoque, variacoes } = dados;
        
        if (imagem) {
            const sql = "UPDATE produto SET nome = ?, categoria = ?, preco = ?, promocao = ?, preco_promocao = ?, qtd_promocao = ?, imagem = ?, estoque = ?, variacoes = ? WHERE id = ?";
            return await db.query(sql, [nome, categoria, preco, promocao, preco_promocao, qtd_promocao, imagem, estoque, variacoes, id]);
        } else {
            const sql = "UPDATE produto SET nome = ?, categoria = ?, preco = ?, promocao = ?, preco_promocao = ?, qtd_promocao = ?, estoque = ?, variacoes = ? WHERE id = ?";
            return await db.query(sql, [nome, categoria, preco, promocao, preco_promocao, qtd_promocao, estoque, variacoes, id]);
        }
    }

    async deletar(id) {
        return await db.query("DELETE FROM produto WHERE id = ?", [id]);
    }
}

module.exports = new ProdutoRepository();