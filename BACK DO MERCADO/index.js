// index.js (Raiz do projeto)
const express = require('express');
const cors = require('cors');
const multer = require('multer'); // ★ NOVO: Importando o Multer
const path = require('path');
const fs = require('fs');

// Puxa a conexão do db
const db = require('./db'); 

// Importando as Rotas
const authRoutes = require('./src/routes/authRoutes');
const produtoRoutes = require('./src/routes/produtoRoutes');
const pedidoRoutes = require('./src/routes/pedidoRoutes');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ★ NOVO: Permite que o Front-end consiga "ver" as imagens salvas
app.use('/uploads', express.static('uploads'));

// Ligando as rotas ao servidor
app.use('/', authRoutes);
app.use('/', produtoRoutes);
app.use('/', pedidoRoutes);

// ==============================================================
// ★ CONFIGURAÇÃO DO UPLOAD DE IMAGENS (MULTER) ★
// ==============================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    // Se a pasta uploads não existir, o Node cria ela na hora!
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Dá um nome único pra foto (Ex: produto-164564654.jpg) para não dar conflito
    cb(null, 'produto-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// ==============================================================
// ★ ROTA DE SALVAR PRODUTO (AGORA COM FOTO) ★
// ==============================================================
// Adicionamos o "upload.single('imagem')" na rota
app.post('/produtos', upload.single('imagem'), async (req, res) => {
  try {
    const { nome, categoria, preco, promocao, preco_promocao, qtd_promocao } = req.body;
    
    // Se o usuário enviou uma foto, salvamos o caminho dela
    const caminhoImagem = req.file ? `/uploads/${req.file.filename}` : null;
    
    const sql = "INSERT INTO produto (nome, categoria, preco, promocao, preco_promocao, qtd_promocao, ativo, imagem) VALUES (?, ?, ?, ?, ?, ?, 1, ?)";
    
    // Converte os textos para True/False e Números
    const isPromo = (promocao === 'true' || promocao === '1');
    const valorPromocional = isPromo && preco_promocao ? parseFloat(preco_promocao) : null;
    const quantidadePromocional = isPromo && qtd_promocao ? parseInt(qtd_promocao) : 1;
    
    const [result] = await db.query(sql, [nome, categoria, preco, isPromo ? 1 : 0, valorPromocional, quantidadePromocional, caminhoImagem]);
    
    res.status(201).json({ message: "Produto cadastrado com sucesso!", id: result.insertId });
    
  } catch (err) {
    console.error("Erro ao salvar produto:", err);
    res.status(500).json({ error: "Erro ao salvar no banco de dados." });
  }
});

// ==============================================================
// ★ ROTA DE DELETAR PRODUTO ★
// ==============================================================
app.delete('/produtos/:id', async (req, res) => {
  try {
    const idDoProduto = req.params.id;
    const sql = "DELETE FROM produto WHERE id = ?";
    await db.query(sql, [idDoProduto]);
    res.status(200).json({ message: "Produto deletado com sucesso!" });
  } catch (err) {
    console.error("Erro ao deletar produto:", err);
    res.status(500).json({ error: "Erro ao deletar no banco de dados." });
  }
});

// ==============================================================
// ★ ROTA DE EDITAR PRODUTO (AGORA COM FOTO) ★
// ==============================================================
app.put('/produtos/:id', upload.single('imagem'), async (req, res) => {
  try {
    const idDoProduto = req.params.id;
    const { nome, categoria, preco, promocao, preco_promocao, qtd_promocao } = req.body;
    
    const isPromo = (promocao === 'true' || promocao === '1');
    const valorPromocional = isPromo && preco_promocao ? parseFloat(preco_promocao) : null;
    const quantidadePromocional = isPromo && qtd_promocao ? parseInt(qtd_promocao) : 1;
    
    // Verifica se enviou uma FOTO NOVA
    if (req.file) {
      const caminhoImagem = `/uploads/${req.file.filename}`;
      const sql = "UPDATE produto SET nome = ?, categoria = ?, preco = ?, promocao = ?, preco_promocao = ?, qtd_promocao = ?, imagem = ? WHERE id = ?";
      await db.query(sql, [nome, categoria, preco, isPromo ? 1 : 0, valorPromocional, quantidadePromocional, caminhoImagem, idDoProduto]);
    } else {
      // Se não enviou foto nova, atualiza só os textos
      const sql = "UPDATE produto SET nome = ?, categoria = ?, preco = ?, promocao = ?, preco_promocao = ?, qtd_promocao = ? WHERE id = ?";
      await db.query(sql, [nome, categoria, preco, isPromo ? 1 : 0, valorPromocional, quantidadePromocional, idDoProduto]);
    }
    
    res.status(200).json({ message: "Produto atualizado com sucesso!" });
    
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    res.status(500).json({ error: "Erro ao atualizar no banco de dados." });
  }
});

// ★ ROTA PARA BUSCAR OS PEDIDOS ★
app.get('/pedidos', async (req, res) => {
  try {
    const sql = "SELECT * FROM pedido ORDER BY id DESC";
    const [pedidos] = await db.query(sql);
    res.status(200).json(pedidos);
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err);
    res.status(500).json({ error: "Erro ao buscar pedidos no banco de dados." });
  }
});

// ★ ROTA PARA ATUALIZAR O STATUS DO PEDIDO ★
app.put('/pedidos/:id/status', async (req, res) => {
  try {
    const idDoPedido = req.params.id;
    const { status } = req.body;
    const sql = "UPDATE pedido SET status = ? WHERE id = ?";
    await db.query(sql, [status, idDoPedido]);
    res.status(200).json({ message: "Status atualizado com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar status do pedido:", err);
    res.status(500).json({ error: "Erro ao atualizar status no banco." });
  }
});

app.listen(PORT, () => {
    console.log(`🚀 Back-end rodando lindamente em http://127.0.0.1:${PORT}`);
});