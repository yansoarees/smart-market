-- CreateTable
CREATE TABLE `Pedido` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataPedido` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `formaPagamento` VARCHAR(191) NOT NULL,
    `formaEntrega` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NULL,
    `total` DOUBLE NOT NULL,
    `itens` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
