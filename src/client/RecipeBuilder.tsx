// RecipeBuilder.tsx
import React, { useState, useEffect, ChangeEvent } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

interface RecipeIngredient {
  Ingredient_Name: string;
  Quantity: number;
  Unit: string;
}

interface RecipeSubmission {
  Email: String;
  Recipe_Name: String;
  Prep_Time: number;
  Cook_Time: number;
  Additional_Time: number;
  Servings: number;
  Calories: number;
  Number_Of_Saves: number;
  Average_Rating: number;
  Directions: string;
}

const RecipeBuilder: React.FC<{ email: string }> = ({ email }) => {
  const token = localStorage.getItem("authToken");
  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredient[]
  >([]);
  const [defaultIngredients, setDefaultIngredients] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [recipeSubmit, setRecipeSubmit] = useState<RecipeSubmission>({
    Email: email,
    Recipe_Name: "",
    Prep_Time: 0,
    Cook_Time: 0,
    Additional_Time: 0,
    Servings: 0,
    Calories: 0,
    Number_Of_Saves: 0,
    Average_Rating: 0,
    Directions: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchIngredientNames = async () => {
      try {
        const response = await fetch("/default-ingredients");

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const ingredientNames: string[] = await response.json();

        setDefaultIngredients(ingredientNames);
      } catch (error) {
        console.error(error);
      }
    };

    fetchIngredientNames();

    const fetchUnitNames = async () => {
      try {
        const response = await fetch("/units");

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const getUnitNames: (string | null)[] = await response.json();

        const cleanedUnitNames = getUnitNames.map((unit) =>
          unit === null ? "None" : unit
        );

        setUnits(cleanedUnitNames);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUnitNames();
  }, []);

  useEffect(() => {
    // console.log("Updated defaultIngredients:", defaultIngredients);
  }, [defaultIngredients]);

  useEffect(() => {
    // console.log("Updated units:", units);
  }, [units]);

  const addIngredient = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      { Ingredient_Name: "", Quantity: 0, Unit: "" },
    ]);
  };

  const deleteIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof RecipeIngredient,
    value: string | number
  ) => {
    const updatedIngredients = [...recipeIngredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value,
    };
    setRecipeIngredients(updatedIngredients);
  };

  const handleCreateIngredient = async (rowIndex: number) => {
    const result = await Swal.fire({
      title: "Create ingredient",
      input: "text",
      inputLabel: "Ingredient name",
      inputPlaceholder: "e.g. Smoked paprika",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Ingredient name is required";
        return null;
      },
    });

    if (!result.isConfirmed) return;
    const name = String(result.value).trim();

    try {
      const res = await fetch("/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((body && (body.error || body.message)) || "Failed to create ingredient");
      }

      const createdName: string = body?.Ingredient_Name || name;
      setDefaultIngredients((prev) => {
        if (prev.includes(createdName)) return prev;
        return [...prev, createdName].sort((a, b) => a.localeCompare(b));
      });

      handleIngredientChange(rowIndex, "Ingredient_Name", createdName);
      await Swal.fire({ title: "Created", text: `"${createdName}" is now available`, icon: "success" });
    } catch (e) {
      await Swal.fire({
        title: "Error",
        text: e instanceof Error ? e.message : "Failed to create ingredient",
        icon: "error",
      });
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    var { name, value } = event.target;
    let newValue: string | number = value;

    // console.log(name);
    if (
      name === "Prep_Time" ||
      name === "Cook_Time" ||
      name === "Additional_Time" ||
      name === "Servings" ||
      name === "Calories"
    ) {
      newValue = isNaN(Number(value)) ? value : Number(value);
    }

    // Update the corresponding field in the recipeSubmit state
    setRecipeSubmit((prevState) => ({
      ...prevState,
      [name]: newValue,
    }));

    // console.log(name + " " + value)
  };

  const handleSubmit = async () => {
    console.log(recipeSubmit);

    try {
      const trimmedName = String(recipeSubmit.Recipe_Name ?? "").trim();
      const trimmedDirections = String(recipeSubmit.Directions ?? "").trim();

      if (!trimmedName) {
        throw new Error("Recipe name is required.");
      }
      if (recipeSubmit.Prep_Time < 0 || recipeSubmit.Cook_Time < 0 || recipeSubmit.Additional_Time < 0) {
        throw new Error("Prep, cook, and additional time must be non-negative.");
      }
      if (recipeSubmit.Servings <= 0) {
        throw new Error("Servings must be at least 1.");
      }
      if (recipeSubmit.Calories < 0) {
        throw new Error("Calories must be non-negative.");
      }
      if (!trimmedDirections) {
        throw new Error("Directions are required.");
      }
      if (recipeIngredients.length === 0) {
        throw new Error("Please add at least one ingredient.");
      }
      for (const ing of recipeIngredients) {
        if (!ing.Ingredient_Name || !ing.Ingredient_Name.trim()) {
          throw new Error("Each ingredient must have a name.");
        }
        if (typeof ing.Quantity !== "number" || Number.isNaN(ing.Quantity) || ing.Quantity <= 0) {
          throw new Error("Each ingredient quantity must be greater than 0.");
        }
        if (!ing.Unit) {
          throw new Error("Each ingredient must have a unit (use 'None' if not applicable).");
        }
      }

      const payload = {
        ...recipeSubmit,
        Recipe_Name: trimmedName,
        Directions: trimmedDirections,
      };

      const response = await fetch("/insert-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: payload,
        }),
      });

      console.log(response);

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        const msg =
          (errBody && (errBody.error || errBody.message)) ||
          `Failed to create recipe: ${response.statusText}`;
        throw new Error(msg);
      } else {
        const created = await response.json();
        const recipeId = created?.recipeId;
        if (!recipeId) {
          throw new Error("Recipe created but no recipeId was returned.");
        }

        for (let i = 0; i < recipeIngredients.length; i++) {
          console.log(recipeIngredients[i]);
          try {
            const response = await fetch("/insert-recipe-content", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                recipeId,
                data: recipeIngredients[i],
              }),
            });
            console.log(response);

            if (!response.ok) {
              throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
          } catch (error: any) {
            console.error(error);
          }
        }
      }
      console.log("All inserts completed, redirecting... ");
      //redirect to the /Recipe page...
      navigate("/recipe");
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Try Again",
        text:
          error instanceof Error
            ? error.message
            : "Cannot create this recipe. Please check your inputs and try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="row">
      <h1 className="text-center mb-4" style={{ color: "orange" }}>
        Recipe Builder
      </h1>
      <div className="col max-width">
        <div className="list-group">
          <h4 className="mt-4">Recipe Name</h4>
          <input
            type="text"
            id="Recipe_Name"
            name="Recipe_Name"
            onChange={handleChange}
          ></input>
          <br></br>
          <h4 className="mt-4">Prep Time</h4>
          <input
            type="number"
            id="Prep_Time"
            name="Prep_Time"
            onChange={handleChange}
          ></input>
          <br></br>
          <h4 className="mt-4">Cook Time</h4>
          <input
            type="number"
            id="Cook_Time"
            name="Cook_Time"
            onChange={handleChange}
          ></input>
          <br></br>
          <h4 className="mt-4">Servings</h4>
          <input
            type="number"
            id="Servings"
            name="Servings"
            onChange={handleChange}
          ></input>
          <br></br>
          <h4 className="mt-4">Calories</h4>
          <input
            type="number"
            id="Calories"
            name="Calories"
            onChange={handleChange}
          ></input>
          <br></br>
          <div className="col-md-6 offset-md-3">
            <h4>Ingredients</h4>
            {recipeIngredients.map((ingredient, index) => (
              <div key={index} className="mb-3 border p-3 rounded">
                <h5>Ingredient {index + 1}</h5>
                <div className="d-flex gap-2 align-items-center mb-2">
                <select
                  value={ingredient.Ingredient_Name}
                  onChange={(e) =>
                    handleIngredientChange(
                      index,
                      "Ingredient_Name",
                      e.target.value
                    )
                  }
                  className="form-control"
                >
                  <option value="" disabled>
                    {" "}
                    --Select an Ingredient
                  </option>
                  {defaultIngredients.map((defaultIngredient, index) => (
                    <option key={index} value={defaultIngredient}>
                      {defaultIngredient}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handleCreateIngredient(index)}
                >
                  Create
                </button>
                </div>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={ingredient.Quantity}
                  onChange={(e) =>
                    handleIngredientChange(
                      index,
                      "Quantity",
                      parseFloat(e.target.value)
                    )
                  }
                  className="form-control mb-2"
                />
                <select
                  value={ingredient.Unit}
                  onChange={(e) =>
                    handleIngredientChange(index, "Unit", e.target.value)
                  }
                  className="form-control mb-2"
                >
                  <option value="" disabled>
                    {" "}
                    --Select a unit of measurement
                  </option>
                  {units.map((unit, index) => (
                    <option key={index} value={unit}>
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

            <button
              type="button"
              className="btn btn-primary mt-3"
              onClick={addIngredient}
            >
              Add Ingredient
            </button>
          </div>
          <h4 className="mt-4">Directions</h4>
          <textarea
            id="rdirections"
            name="Directions"
            style={{ height: "250px" }}
            onChange={handleChange}
          ></textarea>
          <br></br>

          <button
            type="button"
            className="btn btn-success mt-3"
            onClick={handleSubmit}
          >
            Submit Recipe
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeBuilder;
