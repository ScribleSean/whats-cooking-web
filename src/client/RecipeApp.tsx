import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

interface Ingredient {
  Ingredient_Name: string;
  Quantity: number;
  Unit: string;
}

interface Review {
  rating: number;
  comment: string;
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
}

const RecipeApp: React.FC<{ email: string }> = ({ email }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<number[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const selectedRecipeRef = useRef<HTMLDivElement | null>(null);
  const [review, setReview] = useState<Review>({ rating: 0, comment: "" });
  const [message, setMessage] = useState<string>("Loading...");
  const [loading, setLoading] = useState<boolean>(true);

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
          setRecipes(data);
          setMessage("");
        }
      } catch (err) {
        console.error("Error fetching from backend:", err);
        setMessage(
          "Failed to load recipes. Please check if the backend server is running and the endpoint is correct."
        );
      }
    };

    const fetchData = async () => {
      await fetchRecipes();
      setLoading(false);
    };

    fetchData();
  }, [email]);

  const handleRecipeClick = async (recipe: Recipe) => {
    setSelectedRecipe((prevRecipe) =>
      prevRecipe?.Recipe_ID === recipe.Recipe_ID ? null : recipe
    );

    if (recipe.Recipe_ID !== selectedRecipe?.Recipe_ID) {
      try {
        const response = await fetch(`/recipe-reviews/${recipe.Recipe_ID}`);
        if (!response.ok) {
          throw new Error("Failed to fetch recipe reviews");
        }
        const data = await response.json();
        setSelectedRecipe((prevRecipe) =>
          prevRecipe ? { ...prevRecipe, Reviews: data } : null
        );
      } catch (error) {
        console.error("Error fetching recipe reviews:", error);
      }
    }
  };

  const handleSaveRecipe = async (recipeId: number) => {
    try {
      if (savedRecipes.includes(recipeId)) {
        console.log(`Recipe ID ${recipeId} is already saved, unsaving it.`);
        const response = await fetch("/unsave-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, recipeId }),
        });

        if (!response.ok) {
          throw new Error("Failed to unsave recipe");
        }

        setSavedRecipes(savedRecipes.filter((id) => id !== recipeId));
        setRecipes((prevRecipes) =>
          prevRecipes.map((recipe) =>
            recipe.Recipe_ID === recipeId
              ? { ...recipe, Saves: recipe.Saves - 1 }
              : recipe
          )
        );
        alert("Recipe unsaved successfully");
      } else {
        console.log(`Saving recipe ID ${recipeId}.`);
        const response = await fetch("/save-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, recipeId }),
        });

        if (!response.ok) {
          throw new Error("Failed to save recipe");
        }

        setSavedRecipes([...savedRecipes, recipeId]);
        setRecipes((prevRecipes) =>
          prevRecipes.map((recipe) =>
            recipe.Recipe_ID === recipeId
              ? { ...recipe, Saves: recipe.Saves + 1 }
              : recipe
          )
        );
        alert("Recipe saved successfully");
      }
    } catch (error) {
      console.error("Error saving/unsaving recipe:", error);
    }
  };

  const handleLeaveReview = async (recipeId: number) => {
    try {
      const body = JSON.stringify({ email, recipeId, ...review });
      console.log("Sending request to /leave-review with body:", body);

      const response = await fetch("/leave-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      console.log(`Response status: ${response.status}`);
      const responseData = await response.text();
      console.log(`Response data: ${responseData}`);

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe.Recipe_ID === recipeId
            ? {
                ...recipe,
                Reviews: [
                  ...recipe.Reviews,
                  { rating: review.rating, comment: review.comment },
                ],
              }
            : recipe
        )
      );

      alert("Review submitted successfully");
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
      <div className="row">
        <div className="col-md-4">
          <div className="list-group">
            {recipes.map((recipe) => (
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
                  {selectedRecipe.Average_Rating}
                </p>
                <h4 className="mt-4">Ingredients:</h4>
                <ul>
                  {selectedRecipe.Ingredients.map((ingredient, index) => (
                    <li key={index}>
                      {ingredient.Quantity} {ingredient.Unit}{" "}
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
                      {review.comment} (Rating: {review.rating})
                    </li>
                  ))}
                </ul>
                <textarea
                  value={review.comment}
                  onChange={(e) =>
                    setReview({ ...review, comment: e.target.value })
                  }
                  placeholder="Leave a comment"
                />
                <input
                  type="number"
                  value={review.rating}
                  onChange={(e) =>
                    setReview({ ...review, rating: parseInt(e.target.value) })
                  }
                  min="1"
                  max="5"
                  placeholder="Rating (1-5)"
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
