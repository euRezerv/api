import { Router } from "express";
import usersRouterIndex from "./users/index.route";
import companiesRouterIndex from "./companies/index.route";

const router = Router();

router.use("/users", usersRouterIndex);
router.use("/companies", companiesRouterIndex);

export default router;
