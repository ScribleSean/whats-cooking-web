// RecipeBuilder.tsx
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



const RecipeBuilder: React.FC = () => {
    

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
                        {/* <button onClick = {createIngredientDropdown.bind(this)}></button> */}
                        <h4 className="mt-4">Description</h4>
                        <input type="text" id="rdescription" name="rdescription" height={400} width={600}></input>
                        <br></br>
                        <button id="rsubmit" name="rsubmit" value="Submit" onClick={alert.bind(this)} ></button> {/* Change onClick to proper method */}


                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeBuilder;