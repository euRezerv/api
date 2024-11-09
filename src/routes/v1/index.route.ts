import { Router } from "express";
import usersRouter from "./users/index.route";

const router = Router();

router.use("/users", usersRouter);

export default router;
