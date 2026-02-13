import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";

interface FeedRecipe {
  Recipe_ID: number;
  Recipe_Name: string;
  Calories: number;
  Image_Path?: string | null;
  Email: string;
}

const Feed: React.FC = () => {
  const token = localStorage.getItem("authToken");
  const [recipes, setRecipes] = useState<FeedRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch("/feed", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Failed to fetch feed");
        const data = await res.json();
        setRecipes(data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load feed");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [token]);

  if (loading) return <div className="container mt-4">Loading feed...</div>;
  if (error) return <div className="container mt-4">Error: {error}</div>;

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Your Feed</h1>
      {recipes.length === 0 ? (
        <div>You’re not following anyone yet, or they haven’t created recipes.</div>
      ) : (
        <div className="list-group">
          {recipes.map((r) => (
            <div key={r.Recipe_ID} className="list-group-item">
              <div className="d-flex gap-3">
                {r.Image_Path && (
                  <img
                    src={r.Image_Path}
                    alt={r.Recipe_Name}
                    style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 8 }}
                  />
                )}
                <div className="flex-grow-1">
                  <h5 className="mb-1">
                    <Link to={`/recipe?recipeId=${r.Recipe_ID}`}>{r.Recipe_Name}</Link>
                  </h5>
                  <small className="text-muted">
                    by <Link to={`/users/${encodeURIComponent(r.Email)}`}>{r.Email}</Link> • Calories: {r.Calories}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;

