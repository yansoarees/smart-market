// src/repositories/PedidoRepository.js
const db = require('../../db');

class PedidoRepository {
    async buscarTodos() {
        const [rows] = await db.query("SELECT * FROM pedido ORDER BY id DESC");
        return rows;
    }

    async criar(dados) {
        const { nomeCliente, telefone, total, itens, endereco, formaEntrega, formaPagamento } = dados;
        const sql = "INSERT INTO pedido (nomeCliente, telefone, total, itens, endereco, formaEntrega, formaPagamento, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendente')";
        const [result] = await db.query(sql, [nomeCliente, telefone, total, itens, endereco, formaEntrega, formaPagamento]);
        return result.insertId;
    }

    async atualizarStatus(id, status) {
        return await db.query("UPDATE pedido SET status = ? WHERE id = ?", [status, id]);
    }
}

module.exports = new PedidoRepository();