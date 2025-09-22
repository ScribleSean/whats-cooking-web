import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useParams } from "react-router-dom";

interface Review {
  Rating: number;
  Comment: string;
  Recipe_Name?: string;
}

interface Recipe {
  Recipe_ID: number;
  Recipe_Name: string;
  Calories: number;
}

const PublicProfile: React.FC = () => {
  const { email } = useParams();
  const [createdRecipes, setCreatedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;

    const fetchAll = async () => {
      try {
        const [createdRes, savedRes, reviewsRes] = await Promise.all([
          fetch("/user-created-recipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }),
          fetch("/saved-recipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }),
          fetch("/user-reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }),
        ]);

        if (!createdRes.ok) throw new Error("Failed to fetch created recipes");
        if (!savedRes.ok) throw new Error("Failed to fetch saved recipes");
        if (!reviewsRes.ok) throw new Error("Failed to fetch user reviews");

        const [created, saved, reviews] = await Promise.all([
          createdRes.json(),
          savedRes.json(),
          reviewsRes.json(),
        ]);

        setCreatedRecipes(created || []);
        setSavedRecipes(saved || []);
        setUserReviews(reviews || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      }
    };

    fetchAll();
  }, [email]);

  if (!email) return <div className="container mt-4">Missing user email.</div>;
  if (error) return <div className="container mt-4">Error: {error}</div>;

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-1">Public Profile</h1>
      <p className="text-center text-muted">{email}</p>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-0">Created recipes</h5>
              <div className="text-muted">{createdRecipes.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-0">Saved recipes</h5>
              <div className="text-muted">{savedRecipes.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-0">Reviews</h5>
              <div className="text-muted">{userReviews.length}</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mt-4">Created Recipes</h2>
      {createdRecipes.length === 0 ? (
        <div>No recipes created by this user.</div>
      ) : (
        <div className="list-group">
          {createdRecipes.map((recipe) => (
            <div key={recipe.Recipe_ID} className="list-group-item">
              <h5 className="mb-1">{recipe.Recipe_Name}</h5>
              <small>Calories: {recipe.Calories}</small>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-4">Saved Recipes</h2>
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

      <h2 className="mt-4">Reviews</h2>
      {userReviews.length === 0 ? (
        <div>No reviews left by this user.</div>
      ) : (
        <div className="list-group">
          {userReviews.map((review, index) => (
            <div key={index} className="list-group-item">
              <h5 className="mb-1">{review.Recipe_Name}</h5>
              <small>Rating: {review.Rating}</small>
              <p className="mb-0">{review.Comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicProfile;

