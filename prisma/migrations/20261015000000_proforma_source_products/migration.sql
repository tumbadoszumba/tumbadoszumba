-- Proformas que no salen de la calculadora: desde el carrito (pedido por
-- WhatsApp) o armadas por un vendedor en el admin.
-- Solo agrega columnas y vuelve opcionales calculadora y área: las proformas
-- existentes quedan con origen CALCULADORA y el sitio anterior sigue guardando.

-- CreateEnum
CREATE TYPE "ProformaSource" AS ENUM ('CALCULADORA', 'CARRITO', 'VENDEDOR');

-- AlterTable
ALTER TABLE "proformas" ADD COLUMN "source" "ProformaSource" NOT NULL DEFAULT 'CALCULADORA',
ADD COLUMN "createdBySellerName" TEXT,
ALTER COLUMN "area" DROP NOT NULL,
ALTER COLUMN "calculatorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "proforma_items" ADD COLUMN "productId" TEXT;

-- CreateIndex
CREATE INDEX "proforma_items_productId_idx" ON "proforma_items"("productId");

-- AddForeignKey
ALTER TABLE "proforma_items" ADD CONSTRAINT "proforma_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
