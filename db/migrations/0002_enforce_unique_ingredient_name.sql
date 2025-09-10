-- Enforce unique Ingredient.Ingredient_Name (case-sensitive per collation).
-- Strategy:
-- 1) Remove duplicate names, keeping the lowest Ingredient_ID
-- 2) Add a unique constraint on Ingredient_Name

START TRANSACTION;

-- Remove duplicates (keep the row with the smallest Ingredient_ID).
DELETE i_dup
FROM Ingredient i_dup
JOIN Ingredient i_keep
  ON i_dup.Ingredient_Name = i_keep.Ingredient_Name
 AND i_dup.Ingredient_ID > i_keep.Ingredient_ID;

ALTER TABLE Ingredient
  ADD UNIQUE KEY uq_ingredient_name (Ingredient_Name);

COMMIT;

