import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

interface Recipe {
  Recipe_ID: number;
  Recipe_Name: string;
  Prep_Time: number;
  Cook_Time: number;
  Calories: number;
  Servings: number;
  Directions: string;
}

interface Review {
  Recipe_Name: string;
  Rating: number;
  Comment: string;
}

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<{
    savedRecipes: Recipe[];
    reviews: Review[];
  }>({ savedRecipes: [], reviews: [] });

  useEffect(() => {
    fetch("/user-profile/test.test@gmail.com") // Replace with actual user email
      .then((response) => response.json())
      .then((data) => setProfile(data))
      .catch((error) => console.error("Error fetching user profile:", error));
  }, []);

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">User Profile</h1>
      <h2>Saved Recipes</h2>
      <ul className="list-group">
        {profile.savedRecipes.map((recipe) => (
          <li key={recipe.Recipe_ID} className="list-group-item">
            <h5>{recipe.Recipe_Name}</h5>
            <p>Prep Time: {recipe.Prep_Time} mins</p>
            <p>Cook Time: {recipe.Cook_Time} mins</p>
            <p>Calories: {recipe.Calories}</p>
            <p>Servings: {recipe.Servings}</p>
            <h4>Directions:</h4>
            {recipe.Directions.split(/Step \d+:/i).map((step, index) =>
              step.trim() ? <p key={index}>{step.trim()}</p> : null
            )}
          </li>
        ))}
      </ul>
      <h2 className="mt-4">Reviews</h2>
      <ul className="list-group">
        {profile.reviews.map((review, index) => (
          <li key={index} className="list-group-item">
            <h5>{review.Recipe_Name}</h5>
            <p>Rating: {review.Rating} stars</p>
            <p>{review.Comment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserProfile;
