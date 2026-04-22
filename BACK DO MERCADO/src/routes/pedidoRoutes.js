const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

router.post('/pedidos', pedidoController.criar);
router.get('/pedidos', pedidoController.listarTodos);
router.get('/pedidos/:id', pedidoController.buscarPorId);
router.put('/pedidos/editar/:id', pedidoController.editar);

module.exports = router;