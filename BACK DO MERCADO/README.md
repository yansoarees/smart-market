# 🛒 Smart Market - API (Back-end)

Este é o back-end do sistema Smart Market, responsável por gerenciar o banco de dados de produtos, estoque e pedidos em tempo real.

## 🛠️ Tecnologias Utilizadas
- **Node.js** com **Express** (Criação do Servidor)
- **Prisma ORM** (Comunicação com o Banco de Dados)
- **MySQL** (Banco de Dados Relacional)
- **Multer / ImgBB** (Gerenciamento e Upload de Imagens)

---

## 📦 Rotas de Produtos (Estoque)

### `GET /produtos`
- **Descrição:** Retorna a lista completa de todos os produtos cadastrados no banco.
- **Retorno de Sucesso:** Array de objetos com os dados do produto (nome, categoria, preço, estoque, etc).

### `POST /produtos`
- **Descrição:** Cadastra um novo produto no sistema.
- **Corpo da Requisição (FormData):** 
  - `nome` (String)
  - `categoria` (String)
  - `preco` (Float)
  - `promocao` (Boolean)
  - `estoque` (Int)
  - `imagem` (File - opcional)
  - `variacoes` (JSON)

### `PUT /produtos/:id`
- **Descrição:** Atualiza os dados de um produto existente baseado no ID.
- **Parâmetro:** `id` do produto na URL.

### `DELETE /produtos/:id`
- **Descrição:** Exclui um produto do banco de dados.

---

## 🛍️ Rotas de Pedidos (Vendas)

### `GET /pedidos`
- **Descrição:** Retorna o histórico de todos os pedidos feitos na loja.

### `POST /pedidos`
- **Descrição:** Cria um novo pedido vindo do carrinho do cliente.
- **Corpo da Requisição (JSON):**
  - `nomeCliente` (String)
  - `telefone` (String)
  - `total` (Float)
  - `itens` (JSON/String dos produtos)
  - `endereco` (String)
  - `formaEntrega` (String)
  - `formaPagamento` (String)

### `PUT /pedidos/:id/status`
- **Descrição:** Atualiza o status de andamento do pedido (Ex: "Em Preparo", "Saiu para Entrega").
- **Parâmetro:** `id` do pedido na URL.
- **Corpo da Requisição (JSON):** `{ "status": "Novo Status" }`

---

## 📊 Rotas de Relatórios

### `GET /relatorio/estoque`
- **Descrição:** Rota para gerar e baixar o relatório completo do estoque.
- **Retorno:** Arquivo formato Excel (`.xlsx`).

---

## 🚀 Como rodar o servidor localmente

1. Abra o terminal na pasta do back-end.
2. Instale as dependências com o comando: `npm install`
3. Atualize o banco de dados pelo Prisma: `npx prisma db push`
4. Inicie o servidor: `node index.js`
5. A API estará rodando em: `http://localhost:8080`