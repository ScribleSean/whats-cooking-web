import express, { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import ViteExpress from "vite-express";
import cors from 'cors';
import pool from './db';
import { fileURLToPath } from 'url';
import path from "path";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use(cors())
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../dist')));

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET (see .env.example)');
}

function signToken(email: string) {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function getBearerToken(req: Request): string | null {
  const auth = req.header('authorization') || '';
  const m = auth.match(/^Bearer (.+)$/i);
  return m ? m[1] : null;
}

function requireAuth(req: Request, res: Response, next: () => void) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.post('/ingredients', requireAuth, async (req: Request, res: Response) => {
  const { name } = req.body as { name?: unknown };
  const cleaned = typeof name === 'string' ? name.trim() : '';
  if (!cleaned) return res.status(400).json({ error: 'name is required' });

  try {
    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT Ingredient_ID, Ingredient_Name FROM Ingredient WHERE Ingredient_Name = ? LIMIT 1`,
      [cleaned]
    );
    if (existing.length) {
      return res.status(200).json({ Ingredient_ID: existing[0].Ingredient_ID, Ingredient_Name: existing[0].Ingredient_Name });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Ingredient (Ingredient_Name) VALUES (?)`,
      [cleaned]
    );
    return res.status(201).json({ Ingredient_ID: result.insertId, Ingredient_Name: cleaned });
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      const [existing] = await pool.execute<RowDataPacket[]>(
        `SELECT Ingredient_ID, Ingredient_Name FROM Ingredient WHERE Ingredient_Name = ? LIMIT 1`,
        [cleaned]
      );
      if (existing.length) {
        return res.status(200).json({ Ingredient_ID: existing[0].Ingredient_ID, Ingredient_Name: existing[0].Ingredient_Name });
      }
      return res.status(409).json({ error: 'Ingredient already exists' });
    }
    console.error('Error creating ingredient:', err);
    return res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

interface DefaultIngredientName extends RowDataPacket {
  Ingredient_Name: string;
}

interface UnitName extends RowDataPacket {
  Unit: string;
}

interface TopRated extends RowDataPacket {
  Recipe_ID: number;
  Recipe_Name: string;
  Average_Rating: number;
}

const getTopRatedrecipes = async (): Promise<TopRated[]> => {
  try {
      const [rows] = await pool.query<TopRated[]>("SELECT * FROM top_10_recipes_by_average_rating");
      // console.log(rows);
      return rows as TopRated[];
  } catch (error) {
      console.error("Error fetching top 10 highest rated recipes ", error);
      throw error;
  }
};

app.get('/top-rated-recipes', async (req: Request, res: Response) => {
  try {
      const topRatedRecipes = await getTopRatedrecipes();
      res.status(200).json(topRatedRecipes.map((row) => ({
        Recipe_ID: row.Recipe_ID,
        Recipe_Name: row.Recipe_Name,
        Average_Rating: row.Average_Rating
    })));
    
      // console.log("Names of the ingredients", ingredientNames);
  } catch (error) {
      console.error('Error fetching most saved recipes:', error);
      res.status(500).json({ error: 'Failed to fetch most saved recipes' });
  }
});


interface MostSaved extends RowDataPacket {
  Recipe_ID: number;
  Recipe_Name: string;
  Number_Of_Saves: number;
}

const getMostSavedrecipes = async (): Promise<MostSaved[]> => {
  try {
      const [rows] = await pool.query<MostSaved[]>("SELECT * FROM top_10_recipes_by_number_of_saves");
      // console.log(rows);
      return rows as MostSaved[];
  } catch (error) {
      console.error("Error fetching top 10 most saved recipes ", error);
      throw error;
  }
};

app.get('/most-saved-recipes', async (req: Request, res: Response) => {
  try {
      const mostSavedRecipes = await getMostSavedrecipes();
      res.status(200).json(mostSavedRecipes.map((row) => ({
        Recipe_ID: row.Recipe_ID,
        Recipe_Name: row.Recipe_Name,
        Number_Of_Saves: row.Number_Of_Saves
    })));
    
      // console.log("Names of the ingredients", ingredientNames);
  } catch (error) {
      console.error('Error fetching most saved recipes:', error);
      res.status(500).json({ error: 'Failed to fetch most saved recipes' });
  }
});


interface Healthiest extends RowDataPacket {
  Recipe_ID: number;
  Recipe_Name: string;
  Calories: number;
}

const getHealthiestRecipes = async (): Promise<Healthiest[]> => {
  try {
      const [rows] = await pool.query<Healthiest[]>("SELECT * FROM top_10_healthiest_recipes");
      // console.log(rows);
      return rows as Healthiest[];
  } catch (error) {
      console.error("Error fetching top 10 recipes by lowest amount of calories ", error);
      throw error;
  }
};

app.get('/healthiest-recipes', async (req: Request, res: Response) => {
  try {
      const healthiestRecipes = await getHealthiestRecipes();
      res.status(200).json(healthiestRecipes.map((row) => ({
        Recipe_ID: row.Recipe_ID,
        Recipe_Name: row.Recipe_Name,
        Calories: row.Calories
    })));
    
      // console.log("Names of the ingredients", ingredientNames);
  } catch (error) {
      console.error('Error fetching most saved recipes:', error);
      res.status(500).json({ error: 'Failed to fetch most saved recipes' });
  }
});

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


app.get('/recipes', async (req: Request, res: Response) => {
  try {
    
    const recipeQuery = `
      SELECT r.Recipe_ID, r.Recipe_Name, r.Prep_Time, r.Cook_Time, r.Calories, r.Servings,
             i.Ingredient_Name, rc.Quantity, rc.Unit, r.Directions
      FROM Recipe r
      JOIN Recipe_Content rc ON r.Recipe_ID = rc.Recipe_ID
      JOIN Ingredient i ON rc.Ingredient_ID = i.Ingredient_ID
    `;

    const ratingsQuery = `
      SELECT r.Recipe_ID, COALESCE(AVG(rv.Rating), 0) AS Average_Rating
      FROM Recipe r
      LEFT JOIN User_Review rv ON r.Recipe_ID = rv.Recipe_ID
      GROUP BY r.Recipe_ID
    `;
    const [recipeRows] = await pool.query<RowDataPacket[]>(recipeQuery);
    const [ratingsRows] = await pool.query<RowDataPacket[]>(ratingsQuery);

    const ratingsMap = ratingsRows.reduce((map, row) => {
      map[row.Recipe_ID] = row.Average_Rating;
      return map;
    }, {} as { [key: number]: number });

    const recipes = recipeRows.reduce((acc: any, row: any) => {
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
          Directions: row.Directions,
          Average_Rating: ratingsMap[recipeId] || 0, 
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

app.post('/login', async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		const [user] = await pool.query<RowDataPacket[]>('SELECT Email, Password FROM User Where Email=?', [username]);
		if (!user) {
			return res.json({
				success: false,
				message: 'User not found'
			});
		}
		
    const stored = String(user[0].Password ?? '');
    let validPassword = false;
    const looksHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
    if (looksHashed) {
      validPassword = await bcrypt.compare(String(password ?? ''), stored);
    } else {
      // Backward compatible: accept plaintext once, then upgrade to bcrypt.
      validPassword = String(password ?? '') === stored;
      if (validPassword) {
        const hash = await bcrypt.hash(String(password ?? ''), 12);
        await pool.execute('UPDATE User SET Password = ? WHERE Email = ?', [hash, username]);
      }
    }

		if (!validPassword) {
			return res.json({
				success: false,
				message: 'Invalid password'
			});
		}

    const token = signToken(username);
		res.json({
			success: true,
			message: 'Login success',
			user: { email: username },
      token
		});
	} catch (error) {
		console.log(error);
		res.json({
			success: false,
			message: 'error during login'
		});
	}	
});

app.post('/newuser', async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
    const hash = await bcrypt.hash(String(password ?? ''), 12);
    const [result] = await pool.execute('INSERT INTO User (Email, Password) VALUES (?, ?)', [username, hash]);
    if (!result) {
      return res.json({
        success: false,
        message: 'Failed to create.'
      });
    }

    if ((result as any).affectedRows != 1) {
      return res.json({
        success: false,
        message: 'Error; modified too many rows.'
      });
    }
		
		res.json({
			success: true,
			message: 'successfully created user in db',
			user: { email: username }
		});

	} catch (error) {
		console.log(error);
		res.json({
			success: false,
			message: 'error during login'
		});
	} 	
});

app.post('/logout', (req: Request, res: Response) => {
  // Stateless JWT: client should delete token; this endpoint exists for API symmetry.
  res.status(200).json({ success: true });
});


app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});


app.post('/insert-recipe', async (req, res) => {
  const { data } = req.body as { data?: Record<string, unknown> };

  if (!data || typeof data !== 'object') {
    return res.status(400).send('Data is required');
  }

  // Whitelist columns to avoid dynamic SQL column injection.
  const allowedColumns = [
    'Email',
    'Recipe_Name',
    'Prep_Time',
    'Cook_Time',
    'Additional_Time',
    'Servings',
    'Calories',
    'Number_Of_Saves',
    'Average_Rating',
    'Directions',
  ] as const;

  for (const key of Object.keys(data)) {
    if (!allowedColumns.includes(key as (typeof allowedColumns)[number])) {
      return res.status(400).json({ error: `Unknown field: ${key}` });
    }
  }

  const Email = data.Email;
  const Recipe_Name = data.Recipe_Name;

  if (typeof Email !== 'string' || !Email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (typeof Recipe_Name !== 'string' || !Recipe_Name.trim()) {
    return res.status(400).json({ error: 'Recipe_Name is required' });
  }

  const numericFieldNames = [
    'Prep_Time',
    'Cook_Time',
    'Additional_Time',
    'Servings',
    'Calories',
    'Number_Of_Saves',
    'Average_Rating',
  ] as const;

  for (const field of numericFieldNames) {
    const v = (data as any)[field];
    if (typeof v !== 'number' || Number.isNaN(v)) {
      return res.status(400).json({ error: `${field} must be a number` });
    }
  }

  if ((data as any).Prep_Time < 0 || (data as any).Cook_Time < 0 || (data as any).Additional_Time < 0) {
    return res.status(400).json({ error: 'Times must be non-negative' });
  }
  if ((data as any).Servings <= 0) {
    return res.status(400).json({ error: 'Servings must be at least 1' });
  }
  if ((data as any).Calories < 0) {
    return res.status(400).json({ error: 'Calories must be non-negative' });
  }
  if (typeof (data as any).Directions !== 'string' || !(data as any).Directions.trim()) {
    return res.status(400).json({ error: 'Directions is required' });
  }

  const sql = `
    INSERT INTO Recipe (
      Email, Recipe_Name, Prep_Time, Cook_Time, Additional_Time,
      Servings, Calories, Number_Of_Saves, Average_Rating, Directions
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = allowedColumns.map((col) => (data as any)[col]);

  try {
    const [result] = await pool.execute<ResultSetHeader>(sql, values);
    res.status(201).json({ message: 'Recipe inserted successfully', recipeId: result.insertId });
  } catch (err: any) {
    // Trigger SIGNAL errors often surface with sqlState 45000.
    if (err?.sqlState === '45000') {
      return res.status(409).json({ error: err?.message ?? 'Recipe name already exists for this user' });
    }
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Recipe name already exists for this user' });
    }
    console.error('Error inserting data into Recipe:', err);
    res.status(500).send('Error inserting data');
  }
});

app.post('/insert-recipe-content', async (req, res) => {
  const { recipeId, data } = req.body as { recipeId?: number; data?: Record<string, unknown> };

  if (!recipeId || typeof recipeId !== 'number') {
    return res.status(400).send('recipeId is required');
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).send('Data is required');
  }

  const Ingredient_Name = data.Ingredient_Name;
  const Quantity = data.Quantity;
  const Unit = data.Unit;

  if (typeof Ingredient_Name !== 'string' || !Ingredient_Name.trim()) {
    return res.status(400).json({ error: 'Ingredient_Name is required' });
  }
  if (typeof Quantity !== 'number' || Number.isNaN(Quantity)) {
    return res.status(400).json({ error: 'Quantity is required' });
  }
  if (Quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0' });
  }
  if (Unit == null || (typeof Unit !== 'string')) {
    return res.status(400).json({ error: 'Unit is required' });
  }

  const [ingredientRows] = await pool.execute<RowDataPacket[]>(
    `SELECT Ingredient_ID FROM Ingredient WHERE Ingredient_Name = ? LIMIT 1`,
    [Ingredient_Name]
  );

  if (!ingredientRows.length) {
    return res.status(400).json({ error: `Unknown ingredient: ${Ingredient_Name}` });
  }

  const Ingredient_ID = ingredientRows[0].Ingredient_ID;
  const normalizedUnit = Unit === 'None' ? null : Unit;
  const sql = `INSERT INTO Recipe_Content (Recipe_ID, Ingredient_ID, Quantity, Unit) VALUES (?, ?, ?, ?)`;

  try {
    const [result] = await pool.execute<ResultSetHeader>(sql, [
      recipeId,
      Ingredient_ID,
      Quantity,
      normalizedUnit,
    ]);
    res.status(201).json({ message: 'Recipe content inserted successfully', result });
  } catch (err: any) {
    console.error('Error inserting data into Recipe_Content:', err);
    res.status(500).send('Error inserting data');
  }
});
// Save recipe
app.post('/save-recipe', requireAuth, async (req: Request, res: Response) => {
  const { email, recipeId } = req.body;

  console.log('Received request to save recipe:', { email, recipeId });

  if (!email || !recipeId) {
    console.error('Email and Recipe ID are required');
    return res.status(400).send('Email and Recipe ID are required');
  }

  try {
    await pool.query(`
      INSERT INTO User_Saved_Recipe (Email, Recipe_ID)
      VALUES (?, ?)
    `, [email, recipeId]);

    res.status(200).send('Recipe saved successfully');
  } catch (err) {
    console.error('Error saving recipe:', err);
    res.status(500).send('Failed to save recipe');
  }
});

// Unsave recipe
app.post('/unsave-recipe', requireAuth, async (req: Request, res: Response) => {
  const { email, recipeId } = req.body;

  console.log('Received request to unsave recipe:', { email, recipeId });

  if (!email || !recipeId) {
    console.error('Email and Recipe ID are required');
    return res.status(400).send('Email and Recipe ID are required');
  }

  try {
    await pool.query(`
      DELETE FROM User_Saved_Recipe
      WHERE Email = ? AND Recipe_ID = ?
    `, [email, recipeId]);

    res.status(200).send('Recipe unsaved successfully');
  } catch (err) {
    console.error('Error unsaving recipe:', err);
    res.status(500).send('Failed to unsave recipe');
  }
});

// Leave a review
app.post('/leave-review', requireAuth, async (req: Request, res: Response) => {
  const { email, recipeId, Rating, Comment } = req.body;

  console.log('Received request to leave review:', { email, recipeId, Rating, Comment });

  if (!email || !recipeId || !Rating || !Comment) {
    console.error('Email, Recipe ID, Rating, and Comment are required');
    return res.status(400).send('Email, Recipe ID, Rating, and Comment are required');
  }

  try {
    // Enforce "one review per user per recipe" by updating in place.
    // Requires a UNIQUE constraint on (Email, Recipe_ID).
    await pool.query(
      `
      INSERT INTO User_Review (Email, Recipe_ID, Rating, Comment)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Rating = VALUES(Rating),
        Comment = VALUES(Comment)
    `,
      [email, recipeId, Rating, Comment]
    );

    res.status(200).send('Review saved successfully');
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).send('Failed to submit review');
  }
});

app.post('/user-created-recipes', async (req: Request, res: Response) => {
  const { email } = req.body;

  console.log('Received email:', email);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const query = `
      SELECT * FROM Recipe
      WHERE Email = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [email]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching created recipes:', error);
    res.status(500).json({ error: 'Failed to fetch created recipes' });
  }
});

app.post('/saved-recipes', async (req: Request, res: Response) => {
  const { email } = req.body;

  console.log('Received email:', email);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const query = `
      SELECT r.* FROM Recipe r
      JOIN User_Saved_Recipe usr ON r.Recipe_ID = usr.Recipe_ID
      WHERE usr.Email = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [email]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching saved recipes:', error);
    res.status(500).json({ error: 'Failed to fetch saved recipes' });
  }
});

app.post('/user-reviews', async (req: Request, res: Response) => {
  const { email } = req.body;

  console.log('Received email:', email);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const query = `
      SELECT r.Recipe_Name, ur.Rating, ur.Comment FROM User_Review ur
      JOIN Recipe r ON ur.Recipe_ID = r.Recipe_ID
      WHERE ur.Email = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [email]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// Fetch total number of saves for each recipe
app.get('/recipe-saves', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT Recipe_ID, Number_Of_Saves AS Saves
      FROM Recipe
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching recipe saves:', error);
    res.status(500).json({ error: 'Failed to fetch recipe saves' });
  }
});


app.post('/recipe-saves-for-specific-recipe', async (req: Request, res: Response) => {
  const { recipeId } = req.body; 
  
  console.log('Received recipeId:', recipeId);

  if (!recipeId) {
    return res.status(400).json({ error: 'Recipe ID is required' });
  }

  try {
    const query = `
      SELECT Recipe_ID, Number_Of_Saves AS Saves
      FROM Recipe
      WHERE Recipe_ID = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [recipeId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching recipe ratings:', error);
    res.status(500).json({ error: 'Failed to fetch recipe ratings' });
  }
});

app.post('/recipe-saved-ids-for-specific-user', async (req: Request, res: Response) => {
  const { email } = req.body; 
  
  console.log('Received email:', email);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const query = `
      SELECT Recipe_ID
      FROM User_Saved_Recipe
      WHERE Email = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [email]);
    const savedRecipeIDs = rows.map((row) => row.Recipe_ID)
    res.status(200).json(savedRecipeIDs);
  } catch (error) {
    console.error('Error fetching recipe ratings:', error);
    res.status(500).json({ error: 'Failed to fetch saved recipe IDs' });
  }
});


// Fetch total number of saves for each recipe
app.get('/recipe-ratings', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT r.Recipe_ID, COALESCE(AVG(ur.Rating), 0) AS Average_Rating
      FROM Recipe r
      LEFT JOIN User_Review ur ON r.Recipe_ID = ur.Recipe_ID
      GROUP BY r.Recipe_ID
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching recipe ratings:', error);
    res.status(500).json({ error: 'Failed to fetch recipe ratings' });
  }
});



// Fetch average rating for each recipe
app.post('/recipe-ratings-for-specific-recipe', async (req: Request, res: Response) => {
  const { recipeId } = req.body; 
  
  console.log('Received recipeId:', recipeId);

  if (!recipeId) {
    return res.status(400).json({ error: 'Recipe ID is required' });
  }

  try {
    const query = `
      SELECT Recipe_ID, Average_Rating
      FROM Recipe
      WHERE Recipe_ID = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [recipeId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching recipe ratings:', error);
    res.status(500).json({ error: 'Failed to fetch recipe ratings' });
  }
});

app.get('/recipe-reviews', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT Email, Rating, Comment
      FROM User_Review
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching recipe saves:', error);
    res.status(500).json({ error: 'Failed to fetch recipe saves' });
  }
});

// Fetch reviews for each recipe
app.post('/recipe-reviews-for-specific-recipe', async (req: Request, res: Response) => {
  const { recipeId } = req.body; // Assuming you're sending recipeId in the body as part of the request
  
  console.log('Received recipeId:', recipeId);

  if (!recipeId) {
    return res.status(400).json({ error: 'Recipe ID is required' });
  }

  try {
    // Adjust the query to use the recipeId dynamically
    const query = `
      SELECT Email, Rating, Comment
      FROM User_Review
      WHERE Recipe_ID = ?
    `;
    
    // Execute the query with the recipeId
    const [rows] = await pool.execute<RowDataPacket[]>(query, [recipeId]);
    
    // Send the reviews back as the response
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching recipe reviews:', error);
    res.status(500).json({ error: 'Failed to fetch recipe reviews' });
  }
});



app.delete('/delete-recipe', async (req: Request, res: Response) => {
  const { email, recipeId } = req.body;

  console.log('Received request to delete recipe:', { email, recipeId });

  if (!email || !recipeId) {
    console.error('Email and Recipe ID are required');
    return res.status(400).send('Email and Recipe ID are required');
  }

  try {
    const query = `
      DELETE FROM Recipe
      WHERE Recipe_ID = ? AND Email = ?
    `;
    const [result] = await pool.query(query, [recipeId, email]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).send('Recipe not found or you do not have permission to delete this recipe');
    }

    res.status(200).send('Recipe deleted successfully');
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).send('Failed to delete recipe');
  }
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);