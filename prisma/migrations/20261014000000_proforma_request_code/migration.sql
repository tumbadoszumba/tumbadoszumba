-- Proformas sin iniciar sesión + código de solicitud para el WhatsApp.
-- 1) La proforma ya no exige usuario (cliente sin cuenta).
-- 2) Cada proforma tiene un código corto único (ej. TZ-48213). A las que ya
--    existen se les asigna uno al azar. La columna queda opcional para que el
--    sitio publicado antes de este cambio siga guardando proformas mientras se
--    publica el código nuevo (que siempre pone el código).

-- AlterTable
ALTER TABLE "proformas" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "proformas" ADD COLUMN "requestCode" TEXT;

-- Rellenar el código de las proformas existentes
DO $$
DECLARE
  r RECORD;
  c TEXT;
BEGIN
  FOR r IN SELECT "id" FROM "proformas" WHERE "requestCode" IS NULL ORDER BY "createdAt" LOOP
    LOOP
      c := 'TZ-' || (floor(random() * 90000) + 10000)::int::text;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "proformas" WHERE "requestCode" = c);
    END LOOP;
    UPDATE "proformas" SET "requestCode" = c WHERE "id" = r."id";
  END LOOP;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "proformas_requestCode_key" ON "proformas"("requestCode");
