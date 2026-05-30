
require('dotenv').config(); // Puxa as senhas do arquivo .env
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const excelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3001;
 
// Middlewares
app.use(cors({
    origin: [
        "https://smart-market-beta-ten.vercel.app", 
        "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Permite ver as fotos salvas

app.get('/', (req, res) => {
    res.status(200).json({ mensagem: "A API ESTÁ VIVA! O problema é realmente a conexão com o banco." });
});

// Rota de Login Administrativo
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    // Compara o que veio do site com as senhas secretas salvas no Railway
    if (email === process.env.ADMIN_EMAIL && senha === process.env.ADMIN_SENHA) {
        return res.status(200).json({ message: "Acesso liberado!" });
    } else {
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }
});

// ==============================================================
// 2. IMPORTANDO OS REPOSITÓRIOS E ROTAS (Padrão MVC)
// ==============================================================
const ProdutoRepository = require('./src/repositories/ProdutoRepository');
const PedidoRepository = require('./src/repositories/PedidoRepository');
const authRoutes = require('./src/routes/authRoutes');

// Ligando a rota de login
app.use('/', authRoutes);

// ==============================================================
// 3. CONFIGURAÇÃO DO UPLOAD DE IMAGENS (MULTER)
// ==============================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'produto-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// ==============================================================
// ★ ROTAS DE PRODUTOS (Agora usando o ProdutoRepository) ★
// ==============================================================

app.get('/relatorio/estoque', async (req, res) => {
  try {
    const produtos = await ProdutoRepository.buscarTodos();
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estoque Smart Market');

    // Cabeçalhos da Tabela
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Produto', key: 'nome', width: 35 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Preço (R$)', key: 'preco', width: 15 },
      { header: 'Estoque Total', key: 'estoque', width: 15 },
      { header: 'Sabores / Variações', key: 'variacoes', width: 50 },
    ];

    // Preenchendo as linhas com os produtos
    produtos.forEach(prod => {
      let variacoesTexto = '-';
      if (prod.variacoes && prod.variacoes !== '[]' && prod.variacoes !== 'null') {
        try {
          const vars = JSON.parse(prod.variacoes);
          if (vars.length > 0) {
            variacoesTexto = vars.map(v => `${v.nome}: ${v.estoque}`).join(' | ');
          }
        } catch(e) {}
      }

      worksheet.addRow({
        id: prod.id,
        nome: prod.nome,
        categoria: prod.categoria,
        preco: Number(prod.preco).toFixed(2).replace('.', ','),
        estoque: prod.estoque,
        variacoes: variacoesTexto
      });
    });

    // Estilo básico para o Cabeçalho
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00A650' } };

    // Enviar o ficheiro para download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Relatorio_Estoque.xlsx');

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

app.get('/produtos', async (req, res) => {
  try {
    const produtos = await ProdutoRepository.buscarTodos();
    res.json(produtos);
  } catch (err) { res.status(500).json({ error: "Erro ao buscar produtos" }); }
});

app.post('/produtos', upload.single('imagem'), async (req, res) => {
  try {
    const caminhoImagem = req.file ? `/uploads/${req.file.filename}` : null;
    const isPromo = (req.body.promocao === 'true' || req.body.promocao === '1');
    
    const id = await ProdutoRepository.criar({
      ...req.body,
      promocao: isPromo ? 1 : 0,
      imagem: caminhoImagem
    });
    
    res.status(201).json({ message: "Produto cadastrado!", id });
  } catch (err) { res.status(500).json({ error: "Erro ao salvar" }); }
});

app.delete('/produtos/:id', async (req, res) => {
  try {
    await ProdutoRepository.deletar(req.params.id);
    res.status(200).json({ message: "Deletado!" });
  } catch (err) { res.status(500).json({ error: "Erro ao deletar" }); }
});

app.put('/produtos/:id', upload.single('imagem'), async (req, res) => {
  try {
    const caminhoImagem = req.file ? `/uploads/${req.file.filename}` : null;
    const isPromo = (req.body.promocao === 'true' || req.body.promocao === '1');
    
    await ProdutoRepository.atualizar(req.params.id, {
      ...req.body,
      promocao: isPromo ? 1 : 0,
      imagem: caminhoImagem
    });
    res.status(200).json({ message: "Atualizado!" });
  } catch (err) { res.status(500).json({ error: "Erro ao atualizar" }); }
});


// ==============================================================
// ★ ROTAS DE PEDIDOS (Agora usando o PedidoRepository) ★
// ==============================================================
app.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await PedidoRepository.buscarTodos();
    res.json(pedidos);
  } catch (err) { res.status(500).json({ error: "Erro ao buscar pedidos" }); }
});

app.post('/pedidos', async (req, res) => {
    try {
      const id = await PedidoRepository.criar(req.body);
      res.status(201).json({ id });
    } catch (err) { res.status(500).json({ error: "Erro ao salvar pedido" }); }
});

app.put('/pedidos/:id/status', async (req, res) => {
  try {
    await PedidoRepository.atualizarStatus(req.params.id, req.body.status);
    res.json({ message: "Status atualizado" });
  } catch (err) { res.status(500).json({ error: "Erro no status" }); }
});


// ==============================================================
// 4. LIGANDO O SERVIDOR
// ==============================================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Back-end rodando lindamente na porta ${PORT}`);
});