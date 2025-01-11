import { Router } from "express";
import companiesRouter from "./companies.route";
import invitationsRouter from "./invitations.route";

const router = Router();

router.use(companiesRouter);
router.use(invitationsRouter);

export default router;
