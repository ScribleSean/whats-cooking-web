import express, { Request, Response } from "express";
import { RowDataPacket } from 'mysql2'
import ViteExpress from "vite-express";
import cors from 'cors';
import pool from './db';


const app = express();
app.use(express.json())
app.use(cors())

interface DefaultIngredientName extends RowDataPacket {
  Ingredient_Name: string;
}

interface UnitName extends RowDataPacket {
  Unit: string;
}

const getIngredientNames = async (): Promise<DefaultIngredientName[]> => {
  try {
      const [rows] = await pool.query<DefaultIngredientName[]>("SELECT DISTINCT Ingredient_Name FROM Ingredient ORDER BY Ingredient_Name ASC");
      // console.log(rows);
      return rows as DefaultIngredientName[];
  } catch (error) {
      console.error("Error fetching ingredient names:", error);
      throw error;
  }
};

const getUnitNames = async (): Promise<UnitName[]> => {
  try {
    const [rows] = await pool.query<UnitName[]>("SELECT DISTINCT Unit FROM Recipe_Content ORDER BY Unit ASC");
    // console.log(rows);
    return rows as UnitName[];
} catch (error) {
    console.error("Error fetching ingredient names:", error);
    throw error;
}
};


app.get('/default-ingredients', async (req: Request, res: Response) => {
  try {
      const ingredientNames = await getIngredientNames();
      res.status(200).json(ingredientNames.map((row) => row.Ingredient_Name));
      // console.log("Names of the ingredients", ingredientNames);
  } catch (error) {
      console.error('Error fetching ingredient names:', error);
      res.status(500).json({ error: 'Failed to fetch ingredient names' });
  }
});

app.get('/units', async (req: Request, res: Response) => {
  try {
      const unitNames = await getUnitNames();
      res.status(200).json(unitNames.map((row) => row.Unit));
      // console.log("Names of the ingredients", ingredientNames);
  } catch (error) {
      console.error('Error fetching unit names:', error);
      res.status(500).json({ error: 'Failed to fetch unit names' });
  }
});

const constructRecipeUrl = (recipeName: string): string => {
  const formattedName = recipeName.trim().toLowerCase().replace(/\s+/g, '-');
  return `https://www.allrecipes.com/recipes/${formattedName}`;
};

app.get('/', (req: Request, res: Response) => {
  res.send("hi");
});

app.get('/recipes', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT r.Recipe_ID, r.Recipe_Name, r.Prep_Time, r.Cook_Time, r.Calories, r.Servings,
             i.Ingredient_Name, rc.Quantity, rc.Unit, r.Directions
      FROM Recipe r
      JOIN Recipe_Content rc ON r.Recipe_ID = rc.Recipe_ID
      JOIN Ingredient i ON rc.Ingredient_ID = i.Ingredient_ID
    `;
    
    const [rows] = await pool.query<RowDataPacket[]>(query);

    const recipes = rows.reduce((acc: any, row: any) => {
      const recipeId = row.Recipe_ID;
      if (!acc[recipeId]) {
        acc[recipeId] = {
          Recipe_ID: recipeId,
          Recipe_Name: row.Recipe_Name,
          Prep_Time: row.Prep_Time,
          Cook_Time: row.Cook_Time,
          Calories: row.Calories,
          Servings: row.Servings,
          Recipe_Url: constructRecipeUrl(row.Recipe_Name), 
          Ingredients: [],
          Directions: row.Directions
        };
      }
      acc[recipeId].Ingredients.push({
        Ingredient_Name: row.Ingredient_Name,
        Quantity: row.Quantity,
        Unit: row.Unit
      });
      return acc;
    }, {});

    res.status(200).json(Object.values(recipes)); 
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error fetching recipes:', err.message);
      res.status(500).send(`Error fetching recipes: ${err.message}`);
    } else {
      console.error('Unknown error fetching recipes:', err);
      res.status(500).send('Unknown error fetching recipes');
    }
  }
});


app.post('/insert-recipe', async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).send('Data is required');
  }


  // Construct dynamic SQL query
  const columns = Object.keys(data).join(', ');
  const values = Object.values(data).map(value => `'${value}'`).join(', ');

  const sql = `INSERT INTO Recipe (${columns}) VALUES (${values})`;

  //console.log(sql)

  try {
    const result = await pool.query(sql); 
    res.status(200).json({ message: 'Data inserted successfully', result });
  } catch (err) {
    console.error('Error inserting data into Recipe:', err); // Log the error to the console
    res.status(500).send('Error inserting data');
  }
});

app.post('/insert-recipe-content', async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).send('Data is required');
  }

  // Construct dynamic SQL query

  
  const query1 = `SELECT Recipe_ID FROM Recipe r
                  ORDER BY Recipe_ID DESC
                  LIMIT 1;`;
  
  const query2 = `SELECT Ingredient_ID FROM Ingredient i
                  WHERE '${data.Ingredient_Name}' = i.Ingredient_Name`;


  // console.log(query1)

  // console.log(query2)

  const [rows1] = await pool.query<RowDataPacket[]>(query1);
  const [rows2] = await pool.query<RowDataPacket[]>(query2);

  const Recipe_ID = rows1[0].Recipe_ID;
  const Ingredient_ID = rows2[0].Ingredient_ID;

  delete data.Ingredient_Name;
  
  var columns = Object.keys(data).join(', ');
  var values = Object.values(data).map(value => `'${value}'`).join(', ');
  
  columns = 'Recipe_ID, Ingredient_ID, ' + columns;
  values = Recipe_ID + ', ' + Ingredient_ID + ', ' + values;

  // console.log(columns);
  // console.log(values);

  const sql = `INSERT INTO Recipe_Content (${columns}) VALUES (${values})`;

  console.log(sql)

  // res.status(200).json({message: 'Test Queries ran.'})

  try {
    const result = await pool.query(sql); 
    res.status(200).json({ message: 'Data inserted successfully', result });
  } catch (err) {
    console.error('Error inserting data into Recipe_Content:', err); // Log the error to the console
    res.status(500).send('Error inserting data');
  }
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
