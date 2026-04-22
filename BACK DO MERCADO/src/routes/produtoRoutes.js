const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

router.get('/produtos', produtoController.listarTodos);
router.post('/produtos/cadastro', produtoController.criar);
router.delete('/produtos/deletar/:id', produtoController.deletar);
router.put('/produtos/editar/:id', produtoController.editar);

module.exports = router;