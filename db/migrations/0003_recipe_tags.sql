-- Recipe tags / dietary labels

START TRANSACTION;

CREATE TABLE IF NOT EXISTS Recipe_Tag (
  Tag_ID INT NOT NULL AUTO_INCREMENT,
  Tag_Name VARCHAR(64) NOT NULL,
  PRIMARY KEY (Tag_ID),
  UNIQUE KEY uq_recipe_tag_name (Tag_Name)
);

CREATE TABLE IF NOT EXISTS Recipe_Tag_Map (
  Recipe_ID INT NOT NULL,
  Tag_ID INT NOT NULL,
  PRIMARY KEY (Recipe_ID, Tag_ID),
  KEY idx_recipe_tag_map_tag (Tag_ID)
  -- Foreign keys intentionally omitted here to keep this migration compatible with
  -- existing schemas that may not have FK constraints enabled.
);

-- Seed common tags (idempotent).
INSERT INTO Recipe_Tag (Tag_Name) VALUES
  ('Vegan'),
  ('Vegetarian'),
  ('Gluten-Free'),
  ('Dairy-Free'),
  ('Keto'),
  ('Paleo')
ON DUPLICATE KEY UPDATE Tag_Name = VALUES(Tag_Name);

COMMIT;

