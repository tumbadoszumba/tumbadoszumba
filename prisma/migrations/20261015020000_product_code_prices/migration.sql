-- Datos del sistema de facturación en los productos: código (único), modelo y
-- dos precios internos (contado y costo). Solo agrega columnas opcionales.

-- AlterTable
ALTER TABLE "products" ADD COLUMN "cashPrice" DECIMAL(12,3),
ADD COLUMN "costPrice" DECIMAL(12,3),
ADD COLUMN "code" TEXT,
ADD COLUMN "model" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");
