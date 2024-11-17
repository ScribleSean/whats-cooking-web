// RecipeBuilder.tsx
import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import pool from '../server/db';
import mysql, { RowDataPacket } from 'mysql2/promise';

interface DefaultIngredientName extends RowDataPacket {
    Ingredient_Name: string;
}

interface RecipeIngredient {
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
    Ingredients: RecipeIngredient[];
    Directions: string;
}

const RecipeBuilder: React.FC = () => {
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([])
    const [defaultIngredients, setDefaultIngredients] = useState<string[]>([])
    const [units, setUnits] = useState<string[]>([])
    useEffect(() => {
        const fetchIngredientNames = async () => {
            try {
                const response = await fetch('http://localhost:3000/default-ingredients');

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const ingredientNames: string[] = await response.json();

                setDefaultIngredients(ingredientNames);
            }
            catch (error) {
                console.error(error);
            }
        };

        fetchIngredientNames();

        const fetchUnitNames = async () => {
            try {
                const response = await fetch('http://localhost:3000/units');

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const getUnitNames: (string | null)[] = await response.json();

                const cleanedUnitNames = getUnitNames.map((unit) => unit === null ? 'None' : unit);

                setUnits(cleanedUnitNames);
            }
            catch (error) {
                console.error(error);
            }
        };

        fetchUnitNames();
    
    }, []);

    useEffect(() => {
        console.log("Updated defaultIngredients:", defaultIngredients);
    }, [defaultIngredients]);

    useEffect(() => {
        console.log("Updated units:", units);
    }, [units]);

const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { Ingredient_Name: '', Quantity: 0, Unit: '' }])
}

const deleteIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index))
}

const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const updatedIngredients = [...recipeIngredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value }
    setRecipeIngredients(updatedIngredients);
}


// function createIngredientDropdown(){
//     const items = 
// };

return (
    <div className="container mt-4">
        <h1 className="text-center mb-4">Recipe Builder</h1>
        <div className="row">
            <div className="col-md-4">
                <div className="list-group">
                    <h4 className="mt-4">Recipe Name</h4>
                    <input type="text" id="rname" name="rname"></input>
                    <br></br>
                    <h4 className="mt-4">Prep Time</h4>
                    <input type="text" id="rptime" name="rptime"></input>
                    <br></br>
                    <h4 className="mt-4">Cook Time</h4>
                    <input type="text" id="rctime" name="rctime"></input>
                    <br></br>
                    <h4 className="mt-4">Servings</h4>
                    <input type="number" id="rservings" name="rservings"></input>
                    <br></br>
                    <h4 className="mt-4">Calories</h4>
                    <input type="number" id="rcalories" name="rcalories"></input>
                    <br></br>
                    {/* Have a button to add ingredients... */}
                    {/* When button is pressed, an alphabetically sorted dropdown containing ingredients & units will appear, and user can input a number for quantity */}
                    {/* A button should also appear to remove this ingredient */}
                    {/* User will be able to press this button multiple times, with each press adding a new ingredient */}
                    {/* The add ingrdient button should be 'pushed down' such that all ingredients appear before it  */}
                    <div className="col-md-6 offset-md-3">
                        <h4>Ingredients</h4>
                        {recipeIngredients.map((ingredient, index) => (
                            <div key={index} className="mb-3 border p-3 rounded">
                                <h5>Ingredient {index + 1}</h5>
                                <select
                                    value={ingredient.Ingredient_Name}
                                    onChange={(e) => handleIngredientChange(index, 'Ingredient_Name', e.target.value)}
                                    className="form-control mb-2"
                                >
                                    <option value = "" disabled> --Select an Ingredient</option>
                                    {defaultIngredients.map((defaultIngredient, index) => (
                                        <option key={index} value = {defaultIngredient}>
                                            {defaultIngredient}
                                        </option>                                 
                                    ))}
                                    </select>
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    value={ingredient.Quantity}
                                    onChange={(e) => handleIngredientChange(index, 'Quantity', parseFloat(e.target.value) || 0)}
                                    className="form-control mb-2"
                                />
                                <select
                                    value={ingredient.Unit}
                                    onChange={(e) => handleIngredientChange(index, 'Unit', e.target.value)}
                                    className="form-control mb-2"
                                >
                                    <option value = "" disabled> --Select a unit of measurement</option>
                                    {units.map((unit, index) => (
                                        <option key = {index} value  = {unit}>
                                            {unit}
                                        </option>            
                                    ))}
                                    </select>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => deleteIngredient(index)}
                                >
                                    Remove Ingredient
                                </button>
                            </div>
                        ))}

                        <button type="button" className="btn btn-primary mt-3" onClick={addIngredient}>
                            Add Ingredient
                        </button>

                        <button
                            type="button"
                            className="btn btn-success mt-3"
                            onClick={() => alert(JSON.stringify(recipeIngredients, null, 2))}
                        >
                            Submit Recipe
                        </button>
                    </div>
                    <button id="rsubmit" name="rsubmit" value="Submit" onClick={alert.bind(this)} ></button> {/* Change onClick to proper method */}


                </div>
            </div>
        </div>
    </div>
);
};

export default RecipeBuilder;