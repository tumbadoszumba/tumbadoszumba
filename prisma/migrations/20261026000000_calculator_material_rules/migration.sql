-- Reglas por material: aplica solo a ciertas variantes, rendimiento por variante
-- y escala con la separación de studs o la altura de la pared. Nullable: el código
-- anterior sigue funcionando sin la columna llena.
ALTER TABLE "calculator_materials" ADD COLUMN "rules" JSONB;
