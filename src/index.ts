import express, { Express } from "express";
import dotenv from "dotenv";
import setupSwagger from "@utils/swagger";
import routes from "@routes/v1";
import log from "@utils/logger";

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || "3000");

setupSwagger(app, port);
app.use(express.json());

app.use("/v1", routes);

app.listen(port, async () => {
  log.info(`Server is running at ${process.env.URL}:${port}`);
});
