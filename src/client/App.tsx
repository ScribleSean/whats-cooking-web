import React, { useState, useEffect, useRef } from 'react';
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
  Directions: string;
}

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [message, setMessage] = useState<string>('Loading...');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const selectedRecipeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/recipes')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        return response.json();
      })
      .then((data: Recipe[]) => {
        if (data.length === 0) {
          setMessage('No recipes available.');
        } else {
          setRecipes(data);
          setMessage('');
        }
      })
      .catch(err => {
        console.error('Error fetching from backend:', err);
        setMessage('Failed to load recipes. Please check if the backend server is running and the endpoint is correct.');
      });
  }, []);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(prevRecipe => (prevRecipe?.Recipe_ID === recipe.Recipe_ID ? null : recipe)); // Toggle recipe selection
  };

  useEffect(() => {
    if (selectedRecipe && selectedRecipeRef.current) {
      selectedRecipeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedRecipe]);

  return (
    <div className="App">
      <h1>Recipes</h1>
      {message && <p>{message}</p>}
      <div className="container">
        <div className="recipe-list">
          <ul>
            {recipes.map(recipe => (
              <li
                key={recipe.Recipe_ID}
                onClick={() => handleRecipeClick(recipe)}
                className={selectedRecipe?.Recipe_ID === recipe.Recipe_ID ? 'selected' : ''}
              >
                <h3>{recipe.Recipe_Name}</h3>
              </li>
            ))}
          </ul>
        </div>
        {selectedRecipe && (
          <div className="recipe-details" ref={selectedRecipeRef}>
            <div className="details-bubble">
              <h2>{selectedRecipe.Recipe_Name}</h2>
              <p><strong>Calories:</strong> {selectedRecipe.Calories !== undefined ? selectedRecipe.Calories : 'N/A'}</p>
              <p><strong>Prep Time:</strong> {selectedRecipe.Prep_Time} mins</p>
              <p><strong>Cook Time:</strong> {selectedRecipe.Cook_Time} mins</p>
              <p><strong>Servings:</strong> {selectedRecipe.Servings}</p>
              <h4>Ingredients:</h4>
              <ul>
                {selectedRecipe.Ingredients.map((ingredient, index) => (
                  <li key={index}>
                    {ingredient.Quantity} {ingredient.Unit ? ingredient.Unit : ''} {ingredient.Ingredient_Name}
                  </li>
                ))}
              </ul>
              <h4>Directions:</h4>
              {selectedRecipe.Directions.split(/Step \d+:/i).map((step, index) =>
                step.trim() ? <p key={index}>{step.trim()}</p> : null
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
