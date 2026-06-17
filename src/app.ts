import express, {
  type Application,
  type Request,
  type Response,
} from "express";


import {  pool } from "./db";
import { userRoute } from "./modules/user/user.route";
import { issuesRoute } from "./modules/issues/issues.route";
import { authRoute } from "./modules/auth/auth.route";
const app: Application = express();


app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  // console.log('Time:', Date.now());
  next();
});

app.use('/api/auth/signup', userRoute);
app.use('/api/issues', issuesRoute);
app.use("/api/auth", authRoute)









app.get("/", (req: Request, res: Response) => {
  //   res.send('Hello World!')
  res.status(200).json({
    message: "Assignment-2",
    author: "Sabbir Hossain",
  });
});




export default app;
