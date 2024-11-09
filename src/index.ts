import express, { Express } from "express";
import dotenv from "dotenv";
import setupSession from "src/config/session";
import setupSwagger from "src/config/swagger";
import setupPassport from "src/middlewares/passport";
import routes from "./routes/v1/index.route";
import log from "@utils/logger";

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || "3000");

setupSession(app);
setupPassport();
setupSwagger(app, port);

app.use(express.json());

app.use("/v1", routes);

app.listen(port, async () => {
  log.info(`Server is running at ${process.env.URL}:${port}`);
});
