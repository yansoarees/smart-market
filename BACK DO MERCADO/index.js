const express = require('express');
const app = express();

// Pegando a porta dinâmica do Railway obrigatoriamente
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("🔥 SERVIDOR VIVO E RESPIRANDO NO RAILWAY! A culpa é do banco de dados!");
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Teste rodando na porta ${PORT}`);
});