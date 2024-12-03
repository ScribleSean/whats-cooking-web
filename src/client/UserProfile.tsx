import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

interface Review {
  Rating: number;
  Comment: string;
  Recipe_Name?: string; // Add Recipe_Name for user reviews
}

interface Recipe {
  Recipe_ID: number;
  Recipe_Name: string;
  Prep_Time: number;
  Cook_Time: number;
  Calories: number;
  Servings: number;
  Directions: string;
  Saves: number;
  Average_Rating: number;
  Reviews: Review[];
}

interface UserProfileProps {
  email: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ email }) => {
  const [createdRecipes, setCreatedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreatedRecipes = async () => {
      try {
        const response = await fetch("/created-recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch created recipes");
        }
        const data = await response.json();
        setCreatedRecipes(data || []);
      } catch (error) {
        console.error("Error fetching created recipes:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      }
    };

    const fetchSavedRecipes = async () => {
      try {
        const response = await fetch("/saved-recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch saved recipes");
        }
        const data = await response.json();
        setSavedRecipes(data || []);
      } catch (error) {
        console.error("Error fetching saved recipes:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      }
    };

    const fetchUserReviews = async () => {
      try {
        const response = await fetch("/user-reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user reviews");
        }
        const data = await response.json();
        setUserReviews(data || []);
      } catch (error) {
        console.error("Error fetching user reviews:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      }
    };

    fetchCreatedRecipes();
    fetchSavedRecipes();
    fetchUserReviews();
  }, [email]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">User Profile</h1>

      <h2>Saved Recipes</h2>
      {savedRecipes.length === 0 ? (
        <div>No recipes saved by this user.</div>
      ) : (
        <div className="list-group">
          {savedRecipes.map((recipe) => (
            <div key={recipe.Recipe_ID} className="list-group-item">
              <h5 className="mb-1">{recipe.Recipe_Name}</h5>
              <small>Calories: {recipe.Calories}</small>
            </div>
          ))}
        </div>
      )}

      <h2>User Reviews</h2>
      {userReviews.length === 0 ? (
        <div>No reviews left by this user.</div>
      ) : (
        <div className="list-group">
          {userReviews.map((review, index) => (
            <div key={index} className="list-group-item">
              <h5 className="mb-1">{review.Recipe_Name}</h5>
              <small>Rating: {review.Rating}</small>
              <p>{review.Comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
