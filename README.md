#  Smart Market - Sistema de Gestão e Delivery

Um sistema completo (Full-Stack) desenvolvido para automatizar vendas, gestão de estoque e controle de pedidos de um minimercado/bomboniere. A aplicação conta com uma loja virtual (Catálogo e Carrinho de Compras) para os clientes e um Painel Administrativo (Dashboard) seguro para o lojista.

##  Tecnologias Utilizadas

**Front-end:**
* React.js (Vite)
* React Router DOM
* Recharts (Para os gráficos do Dashboard)
* CSS puro (Estilo limpo e responsivo)

**Back-end:**
* Node.js
* Express.js
* Multer (Para upload de imagens)
* Dotenv (Para segurança de variáveis de ambiente)

**Banco de Dados:**
* MySQL

---

##  Como rodar o projeto localmente (Guia de Instalação)

Siga este passo a passo para rodar o projeto na sua máquina.

### Pré-requisitos
* Ter o **Node.js** instalado na máquina.
* Ter o **XAMPP** (ou similar) instalado para rodar o banco de dados MySQL.

### 1. Preparando o Banco de Dados
1. Abra o **XAMPP** e inicie os módulos **Apache** e **MySQL**.
2. Abra o seu gerenciador de banco de dados (ex: phpMyAdmin ou DBeaver).
3. Crie um banco de dados e importe as tabelas necessárias para o sistema rodar (produtos, pedidos, etc.).

### 2. Rodando o Servidor (Back-end)
Abra um terminal e acesse a pasta do Back-end.

\`\`\`bash
# Instale as dependências do projeto
npm install

# Crie o arquivo de segurança (Cofre)
# Crie um arquivo chamado .env na raiz do backend e adicione as suas credenciais:
# ADMIN_EMAIL=seuemail@smart.com
# ADMIN_SENHA=suasenha123
# DB_USER=root
# DB_PASS=suasenhadobanco

# Inicie o servidor Node.js
npm start
\`\`\`
> O Back-end estará rodando na porta **3001** (http://localhost:3001)

### 3. Rodando a Loja (Front-end)
Abra **outro terminal** e acesse a pasta do Front-end.

\`\`\`bash
# Instale as dependências
npm install

# Inicie a aplicação React
npm run dev
\`\`\`
> O Front-end estará rodando, geralmente, na porta **5173** (http://localhost:5173). É só clicar no link que aparecer no terminal!

---

##  Segurança do Painel Administrativo
O painel administrativo (`/admin`) é protegido. Para testar o sistema localmente, utilize as credenciais que você configurou no seu arquivo `.env`.

---
*Desenvolvido com 💻 por Yan Gabriel.*