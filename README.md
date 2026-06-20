# Smart Market - Sistema de Gestão Varejista

O Smart Market é um sistema full-stack desenvolvido para o gerenciamento e automação de um comércio de nicho (bomboniere, mercearia e embalagens). O ecossistema integra uma interface de compras voltada para o consumidor e um painel administrativo robusto para a gestão em tempo real de estoque, vendas e relacionamento com o cliente (CRM).

Este projeto foi desenvolvido como requisito acadêmico para o curso de Análise e Desenvolvimento de Sistemas da Faculdade Nova Roma.

## Estrutura do Projeto

O repositório está dividido em dois módulos principais:

*   **BACK DO MERCADO:** Diretório contendo a API RESTful, lógicas de negócio e comunicação com o banco de dados.
*   **smart-market-react:** Diretório contendo a interface de usuário (Front-end), englobando tanto a loja virtual quanto o painel administrativo (Smart Admin).

## Tecnologias Utilizadas

### Front-end
*   React.js
*   Vite
*   React Router DOM (Roteamento)
*   Recharts (Visualização de dados do dashboard)

### Back-end e Banco de Dados
*   Node.js com Express
*   MySQL
*   Prisma ORM (Modelagem e migrações do banco de dados)
*   Multer (Processamento de uploads)

### Integrações
*   ImgBB API (Hospedagem de imagens em nuvem)
*   WhatsApp API (Redirecionamento dinâmico para fechamento e acompanhamento de pedidos)

## Principais Funcionalidades

*   **Loja Virtual (B2C):** Catálogo dinâmico com sistema de busca, filtragem por categorias e ocultação automática de produtos sem estoque.
*   **Precificação Dinâmica (Atacarejo):** Gatilhos promocionais aplicados automaticamente no carrinho com base na quantidade selecionada pelo usuário.
*   **Gestão de Estoque Detalhada:** Controle de inventário primário e secundário (baseado em variações e sabores de um mesmo produto).
*   **Dashboard Administrativo:** Acompanhamento de métricas financeiras (ticket médio, faturamento semanal) com geração de gráficos baseados em séries temporais.
*   **Gestão de Pedidos e CRM:** Acompanhamento do ciclo de vida dos pedidos, com atualização de status e ranqueamento automático de clientes por volume de compras.

## Instruções de Execução

Para rodar o projeto localmente, é necessário ter o Node.js e o MySQL instalados.

### 1. Configuração do Banco de Dados (Back-end)
Navegue até o diretório do servidor, instale as dependências e sincronize o banco de dados:

```bash
cd "BACK DO MERCADO"
npm install
npx prisma db push
node index.js