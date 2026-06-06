
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { Pool } from "pg";
import config from "./config";
const app: Application = express();
const port = config.port;

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: config.connection_string
   
});

const initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,

    email VARCHAR(255)
    UNIQUE NOT NULL,

    password TEXT NOT NULL,

    role VARCHAR(20)
    DEFAULT 'contributor'
    CHECK (
        role IN (
            'contributor',
            'maintainer'
        )
    ),

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);
            `);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};
initDB()
app.post("/api/users", async(req:Request, res:Response)=>{
     const { name, email, password, role} = req.body;

    try {
         const result = await pool.query(`
      INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'contributor')) RETURNING *
      `, [name, email, password, role])

     res.status(201).json({
      message: "Created a new user",
      
        data: result.rows[0],
      
     })
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message,
        error: error,
      });
      
    }
})
app.get('/api/users', async(req: Request, res:Response)=>{

  try {
    const result = await pool.query(`
      SELECT * FROM users
      `)

      res.status(200).json({
        success: true,
        message: "User retrieved successfully ",
        data: result.rows,
      })
  } catch (error: any) {
     res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
})
app.get("/api/users/:id", async(req: Request, res: Response)=>{

  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT * FROM users WHERE id=$1
      `,[id])

      if(result.rows.length === 0){
        res.status(404).json({
          success: false,
          message: "User Not Found",
          data: null

        })
      }
      res.status(200).json({
        success: true,
        message: "Single user found",
        data: result.rows[0],
      })
  } catch (error: any) {
     res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
})

app.put("/api/users/:id", async(req: Request, res: Response)=>{

  const {id } = req.params;
  try {
    
  } catch (error) {
    
  }
})
app.get("/", (req: Request, res: Response) => {
  //   res.send('Hello World!')
  res.status(200).json({
    message: "Assignment-2",
    author: "Sabbir Hossain",
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
