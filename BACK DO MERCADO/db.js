const mysql = require('mysql2/promise');

// ── Conexão com o XAMPP MySQL ──────────────────────────────
// Se você colocou senha no MySQL do XAMPP, troque '' pela sua senha.
// O banco padrão do XAMPP não tem senha no usuário root.
const db = mysql.createPool({
  host:     'localhost',
  port:     3306,
  user:     'root',
  password: '',          // ← coloque sua senha aqui se tiver
  database: 'mercado_db',
  waitForConnections: true,
  connectionLimit:    10,
});

module.exports = db;
