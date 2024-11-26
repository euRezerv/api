import { Router } from "express";
import usersRouter from "./users/index.route";
import companiesRouter from "./companies/companies.route";

const router = Router();

router.use("/users", usersRouter);
router.use("/companies", companiesRouter);

export default router;
