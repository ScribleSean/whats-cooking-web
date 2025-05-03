# BUGS / Rough Edges (Audit Log)

This file logs issues found during repo orientation (before any fixes). Items are grouped and roughly prioritized by severity.

## P0 — Security / Data Safety

- **Plaintext password storage + comparison**
  - **Where**: `src/server/main.ts` (`POST /newuser`, `POST /login`)
  - **Problem**: Passwords are inserted as-provided and compared via `password == user[0].Password`, strongly indicating plaintext storage.
  - **Impact**: Critical security issue; credential compromise is catastrophic.
  - **Fix**: Store bcrypt hashes, compare via bcrypt. Add JWT/session auth with expiry (see below).

- **Hardcoded remote DB credentials committed to repo**
  - **Where**: `src/server/db.ts`
  - **Problem**: Host/user/password/database are hardcoded (including a real-looking password).
  - **Impact**: Credential leakage, accidental production DB access from local dev, impossible to rotate safely.
  - **Fix**: Move to `.env` + documented env vars; ensure repo contains only `.env.example`.

- **No auth tokens, no session expiry, no logout**
  - **Where**: frontend tracks `isLoggedIn` in memory only (`src/client/App.tsx`); backend returns `{ success: true }` only.
  - **Impact**: No persistent auth, no expiry, no server-side authorization; “logged in” is purely client state.
  - **Fix**: Implement JWT (or server sessions) with expiry; protect endpoints that require a user; add logout endpoint and client logout action.

- **Dynamic SQL column injection surface in recipe insert**
  - **Where**: `src/server/main.ts` (`POST /insert-recipe`)
  - **Problem**: SQL statement is built from `Object.keys(data)` (columns), so a malicious client can submit unexpected keys to alter the statement shape.
  - **Notes**: Values are parameterized, but columns are not (and cannot be), so **columns must be whitelisted**.
  - **Fix**: Validate and whitelist allowed columns; reject unknown fields.

## P0 — Data Integrity / Concurrency

- **Race condition when inserting recipe contents**
  - **Where**: `src/server/main.ts` (`POST /insert-recipe-content`)
  - **Problem**: Retrieves “latest recipe id” via:
    - `SELECT Recipe_ID FROM Recipe ORDER BY Recipe_ID DESC LIMIT 1`
    - Then inserts `Recipe_Content` using that ID.
  - **Impact**: Under concurrent inserts, ingredient rows can attach to the wrong recipe.
  - **Fix**: Use the `INSERT` result’s `insertId` (or `LAST_INSERT_ID()` on the same connection / in a transaction) and send it back to the client; then insert recipe_content with that explicit recipe id.

- **Users can submit multiple reviews for same recipe**
  - **Where**: `src/server/main.ts` (`POST /leave-review`) + DB design described in report
  - **Problem**: API always inserts; no “one review per user per recipe” constraint. Report states Review_ID was added specifically to allow duplicates.
  - **Impact**: Inflated ratings, spam, inconsistent UX.
  - **Fix options**:
    - **Preferred**: enforce unique `(Email, Recipe_ID)` and implement “upsert” (update existing review).
    - **Alternative**: keep multiple reviews but present them clearly (not desired per prompt).

- **Review_ID trigger approach is a concurrency hazard**
  - **Where**: DB (shown in report/screenshots; e.g. `generate_next_review_id` style trigger using `MAX(Review_ID)`)
  - **Problem**: `MAX(id)+1` in a `BEFORE INSERT` trigger can collide under concurrent inserts.
  - **Impact**: Primary key conflicts, dropped writes, wrong IDs.
  - **Fix**: Migrate `Review_ID` to `AUTO_INCREMENT` (or move ID generation to the DB with a safe mechanism).

## P1 — User-visible Bugs / UX

- **Review does not appear immediately after submitting**
  - **Where**: `src/client/RecipeApp.tsx` (`handleLeaveReview`)
  - **Problem**: After POST `/leave-review`, the code refetches reviews but updates `recipes` state only; the UI renders reviews from `selectedRecipe.Reviews`.
  - **Impact**: Matches known issue in report (“shows only after selecting another recipe and returning”).
  - **Fix**: Update `selectedRecipe` state (and optionally recipes list) with the refetched review list; reset the review form after submit.

- **Average rating / saves shown can become stale after actions**
  - **Where**: `src/client/RecipeApp.tsx`
  - **Problem**: Saving/unsaving updates `savedRecipes` but does not refetch the save count; leaving a review does not refetch average rating.
  - **Fix**: After save/unsave, refetch save count for selected recipe; after review submission, refetch average rating (or compute on server and return).

- **Broken/mismatched typing and likely runtime errors around registration**
  - **Where**: `src/client/register.tsx` and `src/client/App.tsx`
  - **Problem**: `Register` component requires `onRegister`, but `App` renders `<Register />` with no props. Also `Register` checks `data.user`, but backend returns `user: username` (string) not `{ email }`.
  - **Impact**: TypeScript errors and/or registration flow not working as intended.
  - **Fix**: Align response shape and component props; simplify register to navigate to login on success.

- **Duplicate `/recipes` route definition on backend**
  - **Where**: `src/server/main.ts` has **two** `app.get('/recipes', ...)` handlers.
  - **Impact**: The second handler can override the first (and changes response shape: one includes `Average_Rating`, the other includes `Reviews` fetched per recipe). Confusing and potentially expensive behavior.
  - **Fix**: Consolidate into a single `/recipes` endpoint; avoid N+1 review queries.

## P1 — Validation / Error Handling

- **No server-side validation for recipe builder fields**
  - **Where**: `src/server/main.ts` (`/insert-recipe`, `/insert-recipe-content`)
  - **Problem**: Accepts negative times, zero servings, empty name, missing directions, empty ingredient rows, etc.
  - **Fix**: Validate request bodies (schema validation) and return 400 with user-friendly messages.

- **No client-side validation for recipe builder**
  - **Where**: `src/client/RecipeBuilder.tsx`
  - **Problem**: Inputs allow empty name, 0 servings, negative values, empty directions, and “Add Ingredient” allows blank fields.
  - **Fix**: Add form validation + inline errors; prevent submit until valid; sanitize and trim text.

- **Duplicate recipe name constraint is only shown as a generic error**
  - **Where**: `src/client/RecipeBuilder.tsx` catch block
  - **Problem**: Always shows “Cannot create a recipe with an already existing name.” without checking for the specific DB error; constraint is actually “unique per user” (per report).
  - **Fix**: Have API return 409 with a clear message; show it in UI, clarifying “unique per user”.

## P2 — Performance / Maintainability

- **N+1 queries for reviews (if using the second `/recipes` handler)**
  - **Where**: `src/server/main.ts` second `/recipes` handler loops over recipes and calls `getRecipeReviews` per recipe.
  - **Impact**: Slow under load; can contribute to “server crashes under load”.
  - **Fix**: Fetch reviews in one query and group in memory, or fetch reviews on-demand per recipe only.

- **Inconsistent query methods (`query` vs `execute`) and inconsistent endpoint design**
  - **Where**: `src/server/main.ts`
  - **Impact**: Harder to audit for injection and correctness.
  - **Fix**: Standardize on parameterized queries and shared helpers.

## P2 — Misc / Polish

- **`constructRecipeUrl` is likely incorrect**
  - **Where**: `src/server/main.ts`
  - **Problem**: Constructs `https://www.allrecipes.com/recipes/<recipe-name-slug>` which is not the actual AllRecipes canonical URL format for a specific recipe.
  - **Fix**: Store the scraped source URL (or omit external URL).

