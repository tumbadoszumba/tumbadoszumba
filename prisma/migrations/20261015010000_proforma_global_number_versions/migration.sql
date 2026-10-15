-- 1) Numeración única de proformas para todos los locales y vendedores.
--    La secuencia sigue desde el número más alto ya entregado.
-- 2) Historial de versiones: solo los datos con que se generó cada PDF.

-- CreateSequence
CREATE SEQUENCE IF NOT EXISTS "proforma_number_seq";
SELECT setval('proforma_number_seq', COALESCE((SELECT MAX("proformaNumber") FROM "proformas"), 99999));

-- Sin índice único en "proformaNumber": ya hay dos proformas de prueba con el
-- 100000 (el local se volvió a crear). Los números nuevos salen de la
-- secuencia, que no repite.

-- CreateTable
CREATE TABLE "proforma_versions" (
    "id" TEXT NOT NULL,
    "proformaId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "sellerName" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proforma_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proforma_versions_proformaId_version_key" ON "proforma_versions"("proformaId", "version");

-- AddForeignKey
ALTER TABLE "proforma_versions" ADD CONSTRAINT "proforma_versions_proformaId_fkey" FOREIGN KEY ("proformaId") REFERENCES "proformas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
