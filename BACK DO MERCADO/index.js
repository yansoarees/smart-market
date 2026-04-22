// index.js (Raiz do projeto)
const express = require('express');
const cors = require('cors');

// Importando as Rotas do nosso padrão MVC
const authRoutes = require('./src/routes/authRoutes');
const produtoRoutes = require('./src/routes/produtoRoutes');
const pedidoRoutes = require('./src/routes/pedidoRoutes');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Ligando as rotas ao servidor
app.use('/', authRoutes);
app.use('/', produtoRoutes);
app.use('/', pedidoRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Back-end (Padrão MVC) rodando lindamente em http://127.0.0.1:${PORT}`);
});