import React, { useState, useEffect } from 'react';
import './App.css';

interface Ingredient {
  Ingredient_Name: string;
  Quantity: number;
  Unit: string;
}

interface Recipe {
  Recipe_ID: number;
  Recipe_Name: string;
  Prep_Time: number;
  Cook_Time: number;
  Servings: number;
  Calories: number;
  Ingredients: Ingredient[];
}

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [message, setMessage] = useState<string>('Loading...');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [recipeUrl, setRecipeUrl] = useState<string | null>(null); // To store the recipe URL

  useEffect(() => {
    fetch('http://localhost:3000/recipes')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        return response.json();
      })
      .then((data: Recipe[]) => {
        setRecipes(data);
        setMessage('');
      })
      .catch(err => {
        console.error('Error fetching from backend:', err);
        setMessage('Failed to load recipes.');
      });
  }, []);


  // Handle clicking on a recipe
  const handleRecipeClick = (id: number, recipeName: string) => {
    setSelectedRecipeId(prevId => (prevId === id ? null : id)); // Toggle recipe selection
  };

  return (
    <div className="App">
      <h1>Recipes</h1>
      {message && <p>{message}</p>}
      <ul>
        {recipes.map(recipe => (
          <li key={recipe.Recipe_ID}>
            {/* Recipe name is clickable */}
            <span onClick={() => handleRecipeClick(recipe.Recipe_ID, recipe.Recipe_Name)}>
              {recipe.Recipe_Name}
            </span>

            {/* Show details if this recipe is selected */}
            {selectedRecipeId === recipe.Recipe_ID && (
              <div>
                <p><strong>Calories:</strong> {recipe.Calories !== undefined ? recipe.Calories : 'N/A'}</p>
                <p><strong>Prep Time:</strong> {recipe.Prep_Time} mins</p>
                <p><strong>Cook Time:</strong> {recipe.Cook_Time} mins</p>
                <p><strong>Servings:</strong> {recipe.Servings}</p>

                <h4>Ingredients:</h4>
                <ul>
                  {recipe.Ingredients && recipe.Ingredients.length > 0 ? (
                    recipe.Ingredients.map((ingredient, index) => (
                      <li key={index}>
                        {ingredient.Quantity} {ingredient.Unit ? ingredient.Unit : ''} {ingredient.Ingredient_Name}
                      </li>
                    ))
                  ) : (
                    <p>No ingredients found</p>
                  )}
                </ul>

                {/* Show the recipe URL */}
                {recipeUrl ? (
                  <p>
                    <a href={recipeUrl} target="_blank" rel="noopener noreferrer">
                      View Recipe
                    </a>
                  </p>
                ) : (
                  <p>Loading recipe URL...</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
