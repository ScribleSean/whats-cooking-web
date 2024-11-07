// RecipeApp.tsx
import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

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

const RecipeApp: React.FC = () => {
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
        setSelectedRecipe(prevRecipe => (prevRecipe?.Recipe_ID === recipe.Recipe_ID ? null : recipe));
    };

    useEffect(() => {
        if (selectedRecipe && selectedRecipeRef.current) {
            selectedRecipeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selectedRecipe]);

    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Recipes</h1>
            {message && <p className="text-center text-muted">{message}</p>}
            <div className="row">
                <div className="col-md-4">
                    <div className="list-group">
                        {recipes.map(recipe => (
                            <div
                                key={recipe.Recipe_ID}
                                onClick={() => handleRecipeClick(recipe)}
                                className={`list-group-item list-group-item-action ${selectedRecipe?.Recipe_ID === recipe.Recipe_ID ? 'active' : ''}`}
                            >
                                <h5 className="mb-1">{recipe.Recipe_Name}</h5>
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
                                <p><strong>Calories:</strong> {selectedRecipe.Calories}</p>
                                <p><strong>Prep Time:</strong> {selectedRecipe.Prep_Time} mins</p>
                                <p><strong>Cook Time:</strong> {selectedRecipe.Cook_Time} mins</p>
                                <p><strong>Servings:</strong> {selectedRecipe.Servings}</p>
                                <h4 className="mt-4">Ingredients:</h4>
                                <ul>
                                    {selectedRecipe.Ingredients.map((ingredient, index) => (
                                        <li key={index}>
                                            {ingredient.Quantity} {ingredient.Unit} {ingredient.Ingredient_Name}
                                        </li>
                                    ))}
                                </ul>
                                <h4 className="mt-4">Directions:</h4>
                                {selectedRecipe.Directions.split(/Step \d+:/i).map((step, index) =>
                                    step.trim() ? <p key={index}>{step.trim()}</p> : null
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecipeApp;
