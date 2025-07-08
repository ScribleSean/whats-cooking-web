-- Enforce one review per user per recipe.
-- Strategy:
-- 1) Remove older duplicate reviews, keeping the highest Review_ID per (Email, Recipe_ID)
-- 2) Add a unique constraint on (Email, Recipe_ID) so future duplicates cannot be inserted

START TRANSACTION;

-- Deduplicate: keep the most recent (highest Review_ID) per user+recipe.
-- This relies on Review_ID being a monotonically increasing identifier.
DELETE ur_old
FROM User_Review ur_old
JOIN User_Review ur_new
  ON ur_old.Email = ur_new.Email
 AND ur_old.Recipe_ID = ur_new.Recipe_ID
 AND ur_old.Review_ID < ur_new.Review_ID;

-- Enforce uniqueness.
ALTER TABLE User_Review
  ADD UNIQUE KEY uq_user_review_email_recipe (Email, Recipe_ID);

COMMIT;

