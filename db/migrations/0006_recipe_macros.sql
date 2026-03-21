-- Nutrition breakdown: optional macros on Recipe

ALTER TABLE Recipe
  ADD COLUMN Protein_g DECIMAL(6,2) NULL,
  ADD COLUMN Fat_g DECIMAL(6,2) NULL,
  ADD COLUMN Carbs_g DECIMAL(6,2) NULL,
  ADD COLUMN Fiber_g DECIMAL(6,2) NULL;

