import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Rating } from "@mui/material";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

interface Ingredient {
  Ingredient_Name: string;
  Quantity: number;
  Unit: string;
}

interface Review {
  Email?: string;
  Rating: number;
  Comment: string;
}

interface Recipe {
  Recipe_ID: number;
  Recipe_Name: string;
  Prep_Time: number;
  Cook_Time: number;
  Servings: number;
  Calories: number;
  Ingredients: Ingredient[];
  Directions: string;
  Saves: number;
  Average_Rating: number;
  Reviews: Review[];
  Tags?: string[];
  Image_Path?: string | null;
}

const RecipeApp: React.FC<{ email: string }> = ({ email }) => {
  const token = localStorage.getItem("authToken");
  const [searchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<number[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const selectedRecipeRef = useRef<HTMLDivElement | null>(null);
  const [review, setReview] = useState<Review>({ Rating: 0, Comment: "" });
  const [message, setMessage] = useState<string>("Loading...");
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [calorieRange, setCalorieRange] = useState<[number, number]>([0, 1000]);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [ingredientQuery, setIngredientQuery] = useState<string>("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pantryMode, setPantryMode] = useState<"off" | "mostly" | "only">("off");
  const [pantryRecipeIds, setPantryRecipeIds] = useState<number[] | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch("/recipes");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data: Recipe[] = await response.json();
        if (data.length === 0) {
          setMessage("No recipes available.");
        } else {
          setRecipes(
            data.map((recipe) => ({
              ...recipe,
              Average_Rating: recipe.Average_Rating ?? 0, 
            }))
          );
          setMessage("");
        }


      } catch (err) {
        console.error("Error fetching from backend:", err);
        setMessage(
          "Failed to load recipes. Please check if the backend server is running and the endpoint is correct."
        );
      }
    };

    const fetchSavedRecipeIDs = async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch("/recipe-saved-ids-for-specific-user", {
          method: "POST",
          headers,
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch saved recipes");
        }
        const data = await response.json();
        setSavedRecipes(data);
      } catch (err) {
        console.error("Error fetching saved recipes:", err);
      }
    };

    const fetchData = async () => {
      await fetchRecipes();
      await fetchSavedRecipeIDs();
      try {
        const tagRes = await fetch("/tags");
        if (tagRes.ok) {
          const tags: { Tag_Name: string }[] = await tagRes.json();
          setAvailableTags((tags || []).map((t) => t.Tag_Name));
        }
      } catch {}
      setLoading(false);
    };

    fetchData();
  }, [email]);

  // If navigated here with ?recipeId=, auto-select that recipe once data is loaded.
  useEffect(() => {
    const qp = searchParams.get("recipeId");
    if (!qp) return;
    const id = Number(qp);
    if (!Number.isFinite(id)) return;
    const recipe = recipes.find((r) => r.Recipe_ID === id);
    if (recipe) handleRecipeClick(recipe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, searchParams]);

  useEffect(() => {
    const runPantrySearch = async () => {
      if (pantryMode === "off") {
        setPantryRecipeIds(null);
        return;
      }
      if (selectedIngredients.length === 0) {
        setPantryRecipeIds([]);
        return;
      }
      try {
        const res = await fetch("/ingredient-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredients: selectedIngredients, mode: pantryMode }),
        });
        if (!res.ok) throw new Error("Failed pantry search");
        const body = await res.json();
        setPantryRecipeIds(body?.recipeIds || []);
      } catch (e) {
        console.error(e);
        setPantryRecipeIds([]);
      }
    };
    runPantrySearch();
  }, [pantryMode, selectedIngredients]);
   const handleAddIngredient = () => {
    if (ingredientQuery.trim() && !selectedIngredients.includes(ingredientQuery.trim().toLowerCase())) {
      setSelectedIngredients([...selectedIngredients, ingredientQuery.trim().toLowerCase()]);
      setIngredientQuery("");
    }
  };
  const handleRemoveIngredient = (ingredient: string) => {
    setSelectedIngredients(selectedIngredients.filter(item => item !== ingredient));
  };
  const filteredAndSortedRecipes = recipes
    .filter(recipe => {
      const matchesSearch = recipe.Recipe_Name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCalories =
        recipe.Calories >= calorieRange[0] && recipe.Calories <= calorieRange[1];
      const matchesRating = ratingFilter ? recipe.Average_Rating >= ratingFilter : true;
      const matchesIngredients =
        selectedIngredients.length === 0 ||
        selectedIngredients.every(ingredient =>
          recipe.Ingredients.some(i => i.Ingredient_Name.toLowerCase().includes(ingredient))
        );
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((t) => (recipe.Tags || []).includes(t));
      const matchesPantry =
        pantryMode === "off" || pantryRecipeIds == null
          ? true
          : pantryRecipeIds.includes(recipe.Recipe_ID);

      return matchesSearch && matchesCalories && matchesRating && matchesIngredients && matchesTags && matchesPantry;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.Recipe_Name.localeCompare(b.Recipe_Name)
          : b.Recipe_Name.localeCompare(a.Recipe_Name);
      } else if (sortBy === "calories") {
        return sortOrder === "asc" ? a.Calories - b.Calories : b.Calories - a.Calories;
      } else if (sortBy === "rating") {
        const ratingA = Number(a.Average_Rating) || 0;
        const ratingB = Number(b.Average_Rating) || 0;
        return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
      }
      return 0;
    });

  const handleRecipeClick = async (recipe: Recipe) => {
    // Check if recipe is already selected, if so, don't update
    if (selectedRecipe?.Recipe_ID === recipe.Recipe_ID) {
      return; // Exit early if the selected recipe is the same
    }

    setSelectedRecipe(recipe); // Set the selected recipe once

    try {
      // Fetch reviews for the selected recipe
      const response = await fetch("/recipe-reviews-for-specific-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.Recipe_ID }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recipe reviews");
      }

      const data = await response.json();
      console.log("Reviews fetched:", data);

      setSelectedRecipe((prevRecipe) =>
        prevRecipe ? { ...prevRecipe, Reviews: data } : prevRecipe
      );

      // Now fetch the average rating for the selected recipe
      await handleGetRecipeRating(recipe);
      console.log(recipe.Recipe_ID);
      await fetchSaveCount(recipe);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
    }
  };

  const handleGetRecipeRating = async (recipe: Recipe) => {
    try {
      const response = await fetch("/recipe-ratings-for-specific-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.Recipe_ID }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recipe rating");
      }

      const data = await response.json();
      const averageRating = data[0]?.Average_Rating ?? 0; 
      console.log("Average Rating:", averageRating);

      // Update the selected recipe with the fetched average rating
      setSelectedRecipe((prevRecipe) =>
        prevRecipe
          ? { ...prevRecipe, Average_Rating: averageRating }
          : prevRecipe
      );
    } catch (error) {
      console.error("Error fetching recipe rating:", error);
    }
  };

  // Function to fetch the updated save count for a specific recipe
  const fetchSaveCount = async (recipe: Recipe) => {
    try {
      const saveCountResponse = await fetch(
        "/recipe-saves-for-specific-recipe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId: recipe.Recipe_ID }),
        }
      );

      if (!saveCountResponse.ok) {
        throw new Error("Failed to fetch updated save count");
      }

      const saveCountData = await saveCountResponse.json();
      console.log("number of saves body", saveCountData);
      const numSaves = saveCountData[0]?.Saves || 0;
      setSelectedRecipe((prevRecipe) =>
        prevRecipe ? { ...prevRecipe, Saves: numSaves } : prevRecipe
      );
    } catch (error) {
      console.error("Error fetching save count:", error);
      return 0; // Default to 0 if there's an error
    }
  };

  // Main function to handle saving and unsaving a recipe
  const handleSaveRecipe = async (recipeId: number) => {
    try {
      // Perform the save or unsave action first
      let response;
      if (savedRecipes.includes(recipeId)) {
        console.log(`Recipe ID ${recipeId} is already saved, unsaving it.`);

        // Unsaving the recipe
        response = await fetch("/unsave-recipe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ email, recipeId }),
        });

        if (!response.ok) {
          throw new Error("Failed to unsave recipe");
        }

        setSavedRecipes(savedRecipes.filter((id) => id !== recipeId));
        Swal.fire({
          title: "Recipe Unsaved",
          text: "The recipe has been unsaved successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
      } else {
        console.log(`Saving recipe ID ${recipeId}.`);

        // Saving the recipe
        response = await fetch("/save-recipe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ email, recipeId }),
        });

        if (!response.ok) {
          throw new Error("Failed to save recipe");
        }

        setSavedRecipes([...savedRecipes, recipeId]);
        Swal.fire({
          title: "Recipe Saved",
          text: "The recipe has been saved successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
      }

      // Fetch the updated number of saves after saving or unsaving the recipe
    } catch (error) {
      console.error("Error saving/unsaving recipe:", error);
    }
  };

  const handleLeaveReview = async (recipeId: number) => {
    try {
      const body = { email, recipeId, ...review }; // Create the request body as an object

      console.log("Sending request to /leave-review with body:", body);

      const response = await fetch("/leave-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body), // JSON stringify here, since the body needs to be JSON
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      // After the review is submitted, fetch the updated reviews for this recipe
      const reviewsResponse = await fetch(
        "/recipe-reviews-for-specific-recipe",
        {
          method: "POST", // You can adjust this to GET if you prefer
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }), // Send the recipeId as a JSON stringified object
        }
      );

      if (!reviewsResponse.ok) {
        throw new Error("Failed to fetch recipe reviews");
      }

      const reviews = await reviewsResponse.json(); // Parse the reviews as JSON
      console.log("Fetched reviews:", reviews);

      // Update both the list and the currently selected recipe immediately.
      setRecipes((prevRecipes) =>
        prevRecipes.map((r) => (r.Recipe_ID === recipeId ? { ...r, Reviews: reviews } : r))
      );
      setSelectedRecipe((prev) =>
        prev && prev.Recipe_ID === recipeId ? { ...prev, Reviews: reviews } : prev
      );

      // Refresh derived fields that depend on reviews.
      if (selectedRecipe && selectedRecipe.Recipe_ID === recipeId) {
        await handleGetRecipeRating(selectedRecipe);
      }

      // Reset the review form for the next entry.
      setReview({ Rating: 0, Comment: "" });

      Swal.fire({
        title: "Review Submitted",
        text: "Your review has been submitted successfully!",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Recipes</h1>
      {message && <p className="text-danger">{message}</p>}
  
      {/* Filters and Sorting */}
      <div className="mb-3">
        {/* Search Bar */}
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
  
        {/* Calorie Range */}
        <label>Calories Range: {calorieRange[0]} - {calorieRange[1]}</label>
        <div>
          <input
            type="range"
            min="0"
            max="2000"
            value={calorieRange[0]}
            onChange={(e) => setCalorieRange([Number(e.target.value), calorieRange[1]])}
          />
          <input
            type="range"
            min="0"
            max="2000"
            value={calorieRange[1]}
            onChange={(e) => setCalorieRange([calorieRange[0], Number(e.target.value)])}
          />
        </div>
  
        {/* Rating Filter */}
        <label>Minimum Rating:</label>
        <select
          className="form-select mb-2"
          value={ratingFilter || ""}
          onChange={(e) => setRatingFilter(Number(e.target.value) || null)}
        >
          <option value="">All Ratings</option>
          <option value="1">1 Star</option>
          <option value="2">2 Stars</option>
          <option value="3">3 Stars</option>
          <option value="4">4 Stars</option>
          <option value="5">5 Stars</option>
        </select>
  
        {/* Ingredient Filter */}
        <div className="mb-3">
          <label>Filter by Ingredients:</label>
          <div className="d-flex">
            <input
              type="text"
              className="form-control"
              value={ingredientQuery}
              onChange={(e) => setIngredientQuery(e.target.value)}
            />
            <button className="btn btn-primary ms-2" onClick={handleAddIngredient}>
              Add
            </button>
          </div>
          <div>
            {selectedIngredients.map((ingredient, index) => (
              <span
                key={index}
                className="badge bg-secondary me-2"
                onClick={() => handleRemoveIngredient(ingredient)}
              >
                {ingredient} &times;
              </span>
            ))}
          </div>
        </div>

        {/* Pantry search */}
        <div className="mb-3">
          <label>Pantry Search:</label>
          <div className="d-flex gap-2 align-items-center mt-1">
            <select
              className="form-select"
              value={pantryMode}
              onChange={(e) => setPantryMode(e.target.value as any)}
              style={{ maxWidth: 220 }}
            >
              <option value="off">Off</option>
              <option value="mostly">Mostly these ingredients</option>
              <option value="only">Only these ingredients</option>
            </select>
            {pantryMode !== "off" && pantryRecipeIds != null && (
              <small className="text-muted">
                Matches: {pantryRecipeIds.length}
              </small>
            )}
          </div>
        </div>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="mb-3">
            <label>Filter by Tags:</label>
            <div className="d-flex flex-wrap gap-2 mt-1">
              {availableTags.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`btn btn-sm ${selected ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
  
        {/* Sort By */}
        <label>Sort By:</label>
        <div className="d-flex">
        <select
          className="form-select me-2"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            console.log("Sort By changed to:", e.target.value); 
          }}
          >
            <option value="name">Name</option>
            <option value="calories">Calories</option>
            <option value="rating">Rating</option>
          </select>
          <select
            className="form-select"
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              console.log("Sort Order changed to:", e.target.value); 
            }}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
  
      {/* Recipe List */}
      <div className="row">
        <div className="col-md-4">
          <div className="list-group">
            {filteredAndSortedRecipes.map((recipe) => (
              <div
                key={recipe.Recipe_ID}
                onClick={() => handleRecipeClick(recipe)}
                className={`list-group-item list-group-item-action ${
                  selectedRecipe?.Recipe_ID === recipe.Recipe_ID ? "active" : ""
                }`}
              >
                <h5 className="mb-1">{recipe.Recipe_Name}</h5>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveRecipe(recipe.Recipe_ID);
                  }}
                  className={`btn ${
                    savedRecipes.includes(recipe.Recipe_ID)
                      ? "btn-danger"
                      : "btn-primary"
                  }`}
                >
                  {savedRecipes.includes(recipe.Recipe_ID)
                    ? "Unsave Recipe"
                    : "Save Recipe"}
                </button>
                <small>Calories: {recipe.Calories}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="col-md-8">
          {selectedRecipe && (
            <div className="card" ref={selectedRecipeRef}>
              <div className="card-body">
                <h2 className="card-title">{selectedRecipe.Recipe_Name}</h2>
                {selectedRecipe.Image_Path && (
                  <img
                    src={selectedRecipe.Image_Path}
                    alt={selectedRecipe.Recipe_Name}
                    style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 12 }}
                  />
                )}
                <p>
                  <strong>Calories:</strong> {selectedRecipe.Calories}
                </p>
                <p>
                  <strong>Prep Time:</strong> {selectedRecipe.Prep_Time} mins
                </p>
                <p>
                  <strong>Cook Time:</strong> {selectedRecipe.Cook_Time} mins
                </p>
                <p>
                  <strong>Servings:</strong> {selectedRecipe.Servings}
                </p>
                <p>
                  <strong>Average Rating:</strong>{" "}
                  {selectedRecipe.Average_Rating == null
                    ? "No ratings yet."
                    : selectedRecipe.Average_Rating}
                </p>
                <p>
                  <strong>Number Of Saves:</strong> {selectedRecipe.Saves}
                </p>
                {selectedRecipe.Tags && selectedRecipe.Tags.length > 0 && (
                  <p>
                    <strong>Tags:</strong> {selectedRecipe.Tags.join(", ")}
                  </p>
                )}
                <h4 className="mt-4">Ingredients:</h4>
                <ul>
                  {selectedRecipe.Ingredients.map((ingredient, index) => (
                    <li key={index}>
                      {ingredient.Quantity} {ingredient.Unit == "None" ? null : ingredient.Unit}{" "}
                      {ingredient.Ingredient_Name}
                    </li>
                  ))}
                </ul>
                <h4 className="mt-4">Directions:</h4>
                {selectedRecipe.Directions.split(/Step \d+:/i).map(
                  (step, index) =>
                    step.trim() ? <p key={index}>{step.trim()}</p> : null
                )}
                <h4 className="mt-4">Reviews:</h4>
                <ul>
                  {(selectedRecipe.Reviews || []).map((review, index) => (
                    <li key={index}>
                      <div>
                        {review.Email ? (
                          <Link to={`/users/${encodeURIComponent(review.Email)}`}>{review.Email}</Link>
                        ) : (
                          <span>Anonymous</span>
                        )}{" "}
                        — {review.Comment} (Rating: {review.Rating})
                      </div>
                    </li>
                  ))}
                </ul>
                <textarea
                  value={review.Comment}
                  onChange={(e) =>
                    setReview({ ...review, Comment: e.target.value })
                  }
                  placeholder="Leave a comment"
                />
                <Rating
                  name="rating"
                  value={review.Rating}
                  onChange={(event, newValue) =>
                    setReview({ ...review, Rating: newValue || 0 })
                  }
                />
                <button
                  onClick={() => handleLeaveReview(selectedRecipe.Recipe_ID)}
                  className="btn btn-success"
                >
                  Submit Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
};

export default RecipeApp;
