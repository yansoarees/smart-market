/*
  Warnings:

  - Added the required column `nomeCliente` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pedido` ADD COLUMN `nomeCliente` VARCHAR(191) NOT NULL;
