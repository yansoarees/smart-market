const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/usuarios/cadastro', authController.cadastrar);
router.post('/login', authController.login);

module.exports = router;