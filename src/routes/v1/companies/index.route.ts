import { Router } from "express";
import companiesRouter from "./companies.route";
import invitationsRouter from "./invitations.route";
import resourcesRouter from "./resources.route";

const router = Router();

router.use(companiesRouter);
router.use("/:companyId/invitations", invitationsRouter);
router.use("/:companyId/resources", resourcesRouter);

export default router;
