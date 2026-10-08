-- Precios unitarios con hasta 3 decimales (tornillos y materiales de centavos, ej. 0.015).
-- Solo amplía las columnas: los valores actuales no cambian.

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "comparePrice" SET DATA TYPE DECIMAL(12,3);
