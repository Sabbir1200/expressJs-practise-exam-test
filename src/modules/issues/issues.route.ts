import { Router } from "express";
import { issuesController } from "./issues.controller";
import { issuesService } from "./issues.service";
import auth from "../../middleware/auth";


const router = Router();
router.post("/", auth("maintainer","contributor"), issuesController.createIssue )
router.get("/", issuesController.getAllIssues )
router.get("/:id", issuesController.getSingleIssues)
router.put("/:id", issuesController.updateIssues)

export const issuesRoute = router;