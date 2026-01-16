-- Optional image path for user-created recipes.
-- Stores a relative URL path like `/uploads/recipes/<file>`.

ALTER TABLE Recipe
  ADD COLUMN Image_Path VARCHAR(255) NULL;

