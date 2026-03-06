import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";

interface SuggestedRecipe {
  Recipe_ID: number;
  Recipe_Name: string;
  Calories: number;
  Image_Path?: string | null;
  Average_Rating?: number;
  overlap?: number;
}

const Suggestions: React.FC = () => {
  const token = localStorage.getItem("authToken");
  const [recipes, setRecipes] = useState<SuggestedRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch("/suggestions", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Failed to fetch suggestions");
        const body = await res.json();
        setRecipes(body?.recipes || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load suggestions");
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [token]);

  if (loading) return <div className="container mt-4">Loading suggestions...</div>;
  if (error) return <div className="container mt-4">Error: {error}</div>;

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Suggestions</h1>
      {recipes.length === 0 ? (
        <div>
          Save or rate a few recipes first — then this page will recommend new ones based on ingredient overlap.
        </div>
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
                    Calories: {r.Calories}
                    {typeof r.Average_Rating === "number" ? ` • Avg rating: ${Number(r.Average_Rating).toFixed(2)}` : ""}
                    {typeof r.overlap === "number" ? ` • Ingredient overlap: ${r.overlap}` : ""}
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

export default Suggestions;

