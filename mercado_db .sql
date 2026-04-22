-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 23/04/2026 às 01:34
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `mercado_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedido`
--

CREATE TABLE `pedido` (
  `id` int(11) NOT NULL,
  `nomeCliente` varchar(191) NOT NULL,
  `telefone` varchar(191) DEFAULT NULL,
  `total` double NOT NULL,
  `itens` text NOT NULL,
  `endereco` text DEFAULT NULL,
  `formaEntrega` varchar(191) DEFAULT NULL,
  `formaPagamento` varchar(191) DEFAULT NULL,
  `status` varchar(191) DEFAULT 'Pendente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `pedido`
--

INSERT INTO `pedido` (`id`, `nomeCliente`, `telefone`, `total`, `itens`, `endereco`, `formaEntrega`, `formaPagamento`, `status`) VALUES
(1, 'dfg', 'dfg', 5.99, '[{\"id\":2,\"nome\":\"Feijão Preto Camil 1KG\",\"preco\":5.99,\"categoria\":\"Mercearia\",\"tipo\":\"und\",\"ativo\":1,\"promocao\":null,\"foto\":\"/img/mercearia/feijao-preto-camil-1kg.png\",\"quantidade\":1}]', 'Retirada', 'Retirada', 'Dinheiro', 'Pendente'),
(2, 'yan gabroel', '(81) 98866-4787', 4.998, '[{\"id\":5,\"nome\":\"Presunto KG\",\"preco\":24.99,\"categoria\":\"Frios\",\"tipo\":\"kg\",\"ativo\":1,\"promocao\":null,\"foto\":\"/img/frios/presunto-kg.png\",\"isPromo\":false,\"precoNormal\":24.99,\"precoPromo\":24.99,\"qtdPromo\":1,\"mensagemPromo\":\"\",\"opcoes\":null,\"idUnico\":\"5-0.2kg\",\"quantidade\":0.2,\"precoVenda\":24.99,\"infoAdicional\":\"0.2kg\"}]', 'Retirada', 'Retirada', 'Dinheiro', 'Pendente'),
(3, 'yan gabroel', '(81) 98866-4787', 22.74, '[{\"id\":9,\"nome\":\"Mistura Láctea Condensada Triangulo 395G\",\"preco\":3.99,\"categoria\":\"PROMOÇÃO\",\"tipo\":\"und\",\"ativo\":1,\"promocao\":null,\"foto\":\"/img/promocao/mistura-lactea-condensada-triangulo-395g.png\",\"isPromo\":true,\"precoNormal\":3.99,\"precoPromo\":3.79,\"qtdPromo\":6,\"mensagemPromo\":\"A partir de 6 un → R$ 3,79 cada\",\"opcoes\":null,\"idUnico\":\"9-padrao\",\"quantidade\":6,\"precoVenda\":3.99,\"infoAdicional\":\"\"}]', 'Retirada', 'Retirada', 'Dinheiro', 'Pendente');

-- --------------------------------------------------------

--
-- Estrutura para tabela `produto`
--

CREATE TABLE `produto` (
  `id` int(11) NOT NULL,
  `nome` varchar(191) NOT NULL,
  `preco` double NOT NULL,
  `categoria` varchar(191) DEFAULT NULL,
  `tipo` varchar(191) DEFAULT 'und',
  `ativo` int(11) DEFAULT 1,
  `promocao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`promocao`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `produto`
--

INSERT INTO `produto` (`id`, `nome`, `preco`, `categoria`, `tipo`, `ativo`, `promocao`) VALUES
(1, 'Feijão Carioca Turquesa 1KG', 7.49, 'Mercearia', 'und', 1, NULL),
(2, 'Feijão Preto Camil 1KG', 5.99, 'Mercearia', 'und', 1, NULL),
(3, 'Refresco Em Pó Tang 25G', 1.25, 'Mercearia', 'und', 1, NULL),
(4, 'Queijo Mussarela KG', 33.99, 'Frios', 'kg', 1, NULL),
(5, 'Presunto KG', 24.99, 'Frios', 'kg', 1, NULL),
(6, 'Ovos', 0.7, 'Hortifruti', 'und', 1, NULL),
(7, 'Biscoito Treloso 130G', 1.99, 'Bomboniere', 'und', 1, NULL),
(8, 'Pippos 30G', 1.99, 'Bomboniere', 'und', 1, NULL),
(9, 'Mistura Láctea Condensada Triangulo 395G', 3.99, 'PROMOÇÃO', 'und', 1, NULL),
(10, 'Leite Condensado Natville 395G', 5.99, 'PROMOÇÃO', 'und', 1, NULL),
(11, 'Copo Descartavel CristalCopo', 2.49, 'Embalagens', 'und', 1, NULL),
(12, 'Prato Descartavel Raso CristalCopo', 1.49, 'Embalagens', 'und', 1, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `nome` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `senha` varchar(191) NOT NULL,
  `papel` varchar(191) DEFAULT 'USER'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`id`, `nome`, `email`, `senha`, `papel`) VALUES
(1, 'Yan (Dono)', 'admin@mercado.com', '123', 'ADMIN');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `pedido`
--
ALTER TABLE `pedido`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `produto`
--
ALTER TABLE `produto`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Usuario_email_key` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `pedido`
--
ALTER TABLE `pedido`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `produto`
--
ALTER TABLE `produto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
