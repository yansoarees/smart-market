const jwt = require('jsonwebtoken');

// Essa é a chave de segurança do seu servidor. Nunca mostre pra ninguém!
const CHAVE_SECRETA = "smart_market_chave_mestra_123";

const authController = {
    login: async (req, res) => {
        const { email, senha } = req.body;
        require('dotenv').config();

        // Credenciais do Dono do Sistema (Você pode mudar depois se quiser)
        const emailAdmin = process.env.ADMIN_EMAIL;
        const senhaAdmin = process.env.ADMIN_SENHA;

        if (email === emailAdmin && senha === senhaAdmin) {
            // Se acertou, o servidor cria um crachá válido por 8 horas
            const token = jwt.sign({ cargo: 'administrador' }, CHAVE_SECRETA, { expiresIn: '8h' });
            
            return res.json({ 
                sucesso: true, 
                mensagem: "Bem-vindo ao painel!", 
                token: token 
            });
        } else {
            // Se errou, barra na porta
            return res.status(401).json({ 
                sucesso: false, 
                mensagem: "E-mail ou senha incorretos." 
            });
        }
    }
};

module.exports = authController;