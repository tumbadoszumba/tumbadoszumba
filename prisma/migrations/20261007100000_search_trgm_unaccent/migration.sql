-- Búsqueda de productos: tolerancia a errores de tipeo (pg_trgm), sin tildes
-- (unaccent) y relevancia por campo (el nombre pesa más que la descripción).

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- unaccent() no es IMMUTABLE y no se puede indexar; este envoltorio sí.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Vector con pesos: A = nombre, C = especificaciones, D = descripción.
CREATE OR REPLACE FUNCTION product_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(NEW."name", ''))), 'A') ||
    setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(NEW."specs"::text, ''))), 'C') ||
    setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(NEW."description", ''))), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Recalcular los productos existentes (dispara el trigger de arriba).
UPDATE "products" SET "name" = "name";

-- Índice de trigramas sobre el nombre normalizado (errores de tipeo y "contiene").
CREATE INDEX IF NOT EXISTS "products_name_trgm_idx"
  ON "products" USING GIN (public.immutable_unaccent(lower("name")) gin_trgm_ops);
