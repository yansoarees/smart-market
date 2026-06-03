const mysql = require('mysql2/promise');
require('dotenv').config();

// ── Conexão Híbrida (Nuvem ou Local) ──────────────────────────────
// Se o Railway fornecer a URL do banco (DATABASE_URL), ele usa a nuvem.
// Se não tiver a URL (no seu PC), ele usa o XAMPP local.
const db = mysql.createPool(process.env.DATABASE_URL || {
  host:     'localhost',
  port:     3306,
  user:     'root',
  password: '',          // ← sua senha local se tiver
  database: 'mercado_db',
  waitForConnections: true,
  connectionLimit:    10,
});

module.exports = db;