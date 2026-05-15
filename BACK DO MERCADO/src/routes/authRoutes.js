const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Quando o Front-end bater aqui, ele tenta fazer o login
router.post('/login', authController.login);

module.exports = router;