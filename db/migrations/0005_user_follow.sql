-- Social following

START TRANSACTION;

CREATE TABLE IF NOT EXISTS User_Follow (
  Follower_Email VARCHAR(255) NOT NULL,
  Followed_Email VARCHAR(255) NOT NULL,
  Created_At TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Follower_Email, Followed_Email)
);

COMMIT;

