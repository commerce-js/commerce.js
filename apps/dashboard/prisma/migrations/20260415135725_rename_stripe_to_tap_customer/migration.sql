/*
  Warnings:

  - You are about to drop the column `stripe_customer` on the `merchants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "merchants" DROP COLUMN "stripe_customer",
ADD COLUMN     "tap_customer_id" TEXT;
