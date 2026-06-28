

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature')),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/user/user.route.ts
import { Router } from "express";

// src/modules/user/user.service.ts
import bcrypt from "bcryptjs";
var createUserIntoDB = async (payLoad) => {
  const { name, email, password, role } = payLoad;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
      INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'contributor')) RETURNING *
      `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var getUserIntoDB = async () => {
  const result = await pool.query(`
      SELECT * FROM users
      `);
  delete result.rows[0].password;
  return result;
};
var getSingleUser = async (payLoad) => {
  const { id } = payLoad;
  const result = await pool.query(
    `
      SELECT * FROM users WHERE id=$1
      `,
    [id]
  );
  delete result.rows[0].password;
  return result;
};
var updateUser = async (payLoad, id) => {
  const { name, password, role } = payLoad;
  const result = await pool.query(
    `
      UPDATE users 
      SET name=COALESCE($1, name), password=COALESCE($2, password),role=COALESCE($3, role)
      WHERE id=$4 RETURNING *
      `,
    [name, password, role, id]
  );
  delete result.rows[0].password;
  return result;
};
var deleteUserFromDB = async (id) => {
  const result = await pool.query(`
       DELETE FROM users 
       WHERE id=$1
      `, [id]);
  return result;
};
var userService = {
  createUserIntoDB,
  getUserIntoDB,
  getSingleUser,
  updateUser,
  deleteUserFromDB
};

// src/utility/index.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var utility_default = sendResponse;

// src/modules/user/user.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await userService.createUserIntoDB(req.body);
    utility_default(res, {
      statusCode: 201,
      success: true,
      message: "Created a new user",
      data: result.rows[0]
    });
  } catch (error) {
    utility_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getUser = async (req, res) => {
  try {
    const result = await userService.getUserIntoDB();
    utility_default(res, {
      statusCode: 200,
      success: true,
      message: "User retrieved successfully",
      data: result.rows
    });
  } catch (error) {
    utility_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleUser2 = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const result = await userService.getSingleUser(id);
    if (result.rows.length === 0) {
      return utility_default(res, {
        statusCode: 404,
        success: false,
        message: "User Not Found",
        data: null
      });
    }
    utility_default(res, {
      statusCode: 200,
      success: true,
      message: "Single user found",
      data: result.rows[0]
    });
  } catch (error) {
    utility_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var updateUser2 = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await userService.updateUser(req.body, id);
    if (result.rows.length === 0) {
      return utility_default(res, {
        statusCode: 404,
        success: false,
        message: "User Not Found",
        data: null
      });
    }
    utility_default(res, {
      statusCode: 200,
      success: true,
      message: "User updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    utility_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await userService.deleteUserFromDB(id);
    if (result.rowCount === 0) {
      return utility_default(res, {
        statusCode: 404,
        success: false,
        message: "User Not Found",
        data: null
      });
    }
    utility_default(res, {
      statusCode: 200,
      success: true,
      message: "User deleted successfully",
      data: null
    });
  } catch (error) {
    utility_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var userController = {
  createUser,
  getUser,
  getSingleUser: getSingleUser2,
  updateUser: updateUser2,
  deleteUser
};

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return utility_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access! Token is missing."
        });
      }
      const decoded = jwt.verify(
        token,
        config_default.jwt_secret
      );
      const userData = await pool.query(
        `SELECT * FROM users WHERE email=$1`,
        [decoded.email]
      );
      if (userData.rows.length === 0) {
        return utility_default(res, {
          statusCode: 404,
          success: false,
          message: "User not found"
        });
      }
      const user = userData.rows[0];
      if (roles.length && !roles.includes(user.role)) {
        return utility_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden access"
        });
      }
      req.user = user;
      next();
    } catch (error) {
      return utility_default(res, {
        statusCode: 401,
        success: false,
        message: error.message || "Invalid or expired token"
      });
    }
  };
};
var auth_default = auth;

// src/modules/user/user.route.ts
var router = Router();
router.post("/", userController.createUser);
router.get("/", auth_default(), userController.getUser);
router.get("/:id", userController.getSingleUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
var userRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssuesIntoDB = async (payload, user) => {
  const { title, description, type } = payload;
  const reporter_id = user.id;
  const userResult = await pool.query(
    `
    SELECT * FROM users
    WHERE id = $1
    `,
    [reporter_id]
  );
  if (userResult.rows.length === 0) {
    throw new Error("User not found");
  }
  const result = await pool.query(
    `
    INSERT INTO issues
    (
      title,
      description,
      type,
      status,
      reporter_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [title, description, type, "open", reporter_id]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async () => {
  const result = await pool.query(`
    SELECT * FROM issues 
  `);
  return result;
};
var singleIssuesFromDB = async (id) => {
  const result = await pool.query(
    `
      SELECT * FROM issues WHERE id=$1
    `,
    [id]
  );
  return result;
};
var updateIssuesFromDB = async (id, payLoad, user) => {
  const { title, description, type } = payLoad;
  const checkIssue = await pool.query(
    `SELECT reporter_id, status FROM issues WHERE id = $1`,
    [id]
  );
  if (checkIssue.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const { reporter_id, status } = checkIssue.rows[0];
  const isMaintainer = user.role === "maintainer";
  const isOwner = reporter_id === user.id;
  const isOpen = status === "open";
  if (!isMaintainer && !(isOwner && isOpen)) {
    throw new Error("You do not have permission to update this issue");
  }
  const result = await pool.query(
    `
    UPDATE issues
    SET 
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      type = COALESCE($3, type),
      updated_at = NOW()
    WHERE id = $4
    RETURNING *
    `,
    [title ?? null, description ?? null, type ?? null, id]
  );
  return result.rows[0];
};
var issuesService = {
  createIssuesIntoDB,
  getAllIssuesFromDB,
  singleIssuesFromDB,
  updateIssuesFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const payload = req.body;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized! Token is missing or invalid."
      });
    }
    const result = await issuesService.createIssuesIntoDB(payload, req.user);
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issuesService.getAllIssuesFromDB();
    res.status(200).json({
      success: true,
      message: "All issues are here",
      data: result.rows
    });
  } catch (error) {
    utility_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssues = async (req, res) => {
  const { id } = req.params;
  try {
    console.log("this is ", id);
    const result = await issuesService.singleIssuesFromDB(id);
    if (result.rows.length === 0) {
      return utility_default(res, {
        statusCode: 404,
        success: false,
        message: "User Not Found",
        data: null
      });
    }
    res.status(200).json({
      success: true,
      message: "All issues are here",
      data: result.rows[0]
    });
  } catch (error) {
    utility_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      data: null
    });
  }
};
var updateIssues = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  try {
    const result = await issuesService.updateIssuesFromDB(
      id,
      req.body,
      user
    );
    if (result.rows.length === 0) {
      return utility_default(res, {
        statusCode: 404,
        success: false,
        message: "User Not Found",
        data: null
      });
    }
    res.status(200).json({
      success: true,
      message: "All issues are here",
      data: result.rows
    });
  } catch (error) {
    console.log("eroor");
    utility_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssues,
  updateIssues
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_default("maintainer", "contributor"), issuesController.createIssue);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssues);
router2.put("/:id", issuesController.updateIssues);
var issuesRoute = router2;

// src/modules/auth/auth.route.ts
import { Router as Router3 } from "express";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcryptjs";
import jwt2 from "jsonwebtoken";
var loginUserIntoDB = async (payLoad) => {
  const { email, password } = payLoad;
  const userData = await pool.query(`
        SELECT * FROM users WHERE email=$1
        
        `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt2.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const accessToken = jwt2.sign(jwtPayload, config_default.jwt_secret, { expiresIn: "1d" });
  return { accessToken };
};
var authService = {
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    utility_default(res, {
      statusCode: 200,
      success: true,
      message: "User logged in successfully",
      data: result
    });
  } catch (error) {
    utility_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  loginUser
};

// src/modules/auth/auth.route.ts
var router3 = Router3();
router3.post("/login", authController.loginUser);
var authRoute = router3;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  next();
});
app.use("/api/auth/signup", userRoute);
app.use("/api/issues", issuesRoute);
app.use("/api/auth", authRoute);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Assignment-2",
    author: "Sabbir Hossain"
  });
});
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map