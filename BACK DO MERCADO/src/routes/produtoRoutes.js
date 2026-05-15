const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

router.get('/produtos', produtoController.listarTodos);
router.post('/produtos', produtoController.criar); // Ligado direto no Admin
router.delete('/produtos/:id', produtoController.deletar); // Ligado direto no Admin
router.put('/produtos/:id', produtoController.editar); // Ligado direto no Admin

module.exports = router;