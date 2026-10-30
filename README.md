# What's Cooking

Community-driven recipe web application built by a team of 5 for a database management systems course (CS 542). Users can browse recipes scraped from AllRecipes, filter/sort by multiple criteria, save recipes, leave ratings + comments, and create their own recipes with a recipe builder.

## Architecture overview

- **Frontend**: React SPA in `src/client/` (React Router pages: login/register, recipe list + details, recipe builder, profile, top-10 statistics)
- **Backend**: Express app in `src/server/main.ts`, served alongside Vite via `vite-express`
- **Database**: MySQL schema with 6 core tables plus views + triggers for derived fields (average rating, number of saves, etc.)

## Database model (ERD summary)

Core relations (6 total):

- **User**: `Email` (PK), `Password`
- **Recipe**: `Recipe_ID` (PK), `Email` (FK→User), `Recipe_Name`, `Prep_Time`, `Cook_Time`, `Additional_Time`, `Servings`, `Calories`, `Directions`, derived `Average_Rating`, derived `Number_Of_Saves`
- **Ingredient**: `Ingredient_ID` (PK), `Ingredient_Name`
- **Recipe_Content**: `Recipe_Content_ID` (PK), `Recipe_ID` (FK→Recipe), `Ingredient_ID` (FK→Ingredient), `Quantity`, `Unit`
- **User_Saved_Recipe**: `(Email, Recipe_ID)` (composite PK; FKs to User + Recipe)
- **User_Review**: `Review_ID` (PK per report), plus `(Email, Recipe_ID)` (FKs), `Rating`, `Comment`

Normalization (per report): all tables are in **BCNF**.

## Database features (views / triggers / indexes)

From the project report (see `images/whats_cooking_report.pdf`):

- **Views**
  - Top 10 recipes by average rating
  - Top 10 recipes by number of saves
  - Top 10 healthiest recipes (lowest calories)
- **Triggers**
  - Prevent deleting “high quality” recipes (average rating \(> 4.0\))
  - Update derived attributes (`Average_Rating`, `Number_Of_Saves`) when reviews/saves change
  - ID generation triggers
- **Indexes**
  - Composite index for `Recipe_Content(Recipe_ID, Ingredient_ID)` to speed up common joins

## Running locally

### Prerequisites

- Node.js (recommended: 20+)
- MySQL 8+ (or a remote MySQL instance with the schema loaded)

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env` and fill in values:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `PORT` (default: 3000)
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (default: `7d`)

### Run dev server (client + API)

```bash
npm run dev
```

Then open the app at `http://localhost:3000`.

## API endpoints

All routes are currently mounted at the server root (no `/api` prefix).

### Auth

- `POST /login`
- `POST /newuser`
- `POST /logout`
- `POST /follow`
- `POST /unfollow`
- `GET /following`
- `GET /feed`
- `GET /suggestions`
- `GET /admin/stats`
- `DELETE /admin/recipe/:id`
- `DELETE /admin/user/:email`

### Recipes / Ingredients

- `GET /recipes`
- `POST /insert-recipe`
- `POST /insert-recipe-content`
- `POST /recipe-image`
- `POST /ingredients`
- `POST /ingredient-search`
- `GET /tags`
- `POST /recipe-tags`
- `GET /default-ingredients`
- `GET /units`

### Saves

- `POST /save-recipe`
- `POST /unsave-recipe`
- `GET /recipe-saves`
- `POST /recipe-saves-for-specific-recipe`
- `POST /recipe-saved-ids-for-specific-user`

### Reviews / Ratings

- `POST /leave-review`
- `GET /recipe-reviews`
- `POST /recipe-reviews-for-specific-recipe`
- `POST /recipe-ratings-for-specific-recipe`

### User profile

- `POST /user-created-recipes`
- `POST /saved-recipes`
- `POST /user-reviews`
- `DELETE /delete-recipe`

### Statistics (DB views)

- `GET /top-rated-recipes`
- `GET /most-saved-recipes`
- `GET /healthiest-recipes`

## Screenshots

All screenshots are in `images/`.

- **Recipe list + filters**: `images/Recipe_Screen.png`
- **Recipe details + review form**: `images/Recipe_and_Review_Info.png`
- **Recipe builder**: `images/Recipe_Builder_Screen.png`
- **User profile**: `images/User_Profile_Screen.png`
- **Top 10 views**: `images/View_1.png`, `images/View_2.png`, `images/View_3.png`

## Known limitations

- Some database triggers shown in the report use `MAX(id)+1` patterns that can race under concurrent inserts.
- Validation and error states are thin in parts of the UI.

## Features

- Custom ingredient creation: create new ingredients directly from the Recipe Builder
- Public user profiles: browse `/users/:email` to see another user’s recipes, saves, and reviews
- Recipe tags / dietary labels: tag recipes and filter the main recipe list by selected tags
- Ingredient-based recipe search: “pantry search” mode for recipes that use only/mostly your ingredients
- Recipe image upload: attach an image to your recipe and display it on the recipe page
- Social following: follow users and browse a personalized feed of their latest recipes
- AI recipe suggestions: recommends recipes based on ingredient overlap with your saves and high ratings
- Nutrition breakdown: optional protein/fat/carbs/fiber macros displayed alongside calories
- Shopping list export: generate a copyable ingredient list from any recipe page
- Admin dashboard: protected `/admin` view with user/recipe stats and moderation deletes

## Bug fixes

Recent improvements (post-report):

- Review submissions refresh the selected recipe’s review list immediately
- Enforced one review per user per recipe (API upsert + DB migration)
- Recipe creation no longer uses “latest Recipe_ID” (concurrency-safe recipe builder inserts)
- Added bcrypt password hashing + JWT auth with expiry and logout

## Contributing

Issues and pull requests are welcome. Run `npm run dev` against a local MySQL database to test a change, and keep pull requests focused on one fix or feature.

## Contributors

Built by a team of 5: [@ScribleSean](https://github.com/ScribleSean), [@abell625](https://github.com/abell625), [@spencer-gre](https://github.com/spencer-gre), [@12axel](https://github.com/12axel) and [@jocordova7](https://github.com/jocordova7).

## License

No license has been chosen yet; all rights reserved by the contributors.
