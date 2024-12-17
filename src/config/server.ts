import express, { Express } from "express";
import setupSession from "src/config/session";
import setupSwagger from "src/config/swagger";
import setupPassport from "src/config/passport";
import routes from "../routes/v1/index.route";
import log from "@utils/logger";

export const getServerPort = () => {
  if (process.env.PORT) {
    return parseInt(process.env.PORT);
  }

  log.error("PORT is not defined in the environment");
  throw new Error("PORT is not defined in the environment");
};

const createServer = (port?: number) => {
  const app: Express = express();

  setupSession(app);
  setupPassport();

  if (port) {
    setupSwagger(app, port);
  }

  app.use(express.json());

  app.use("/v1", routes);

  return app;
};

export default createServer;
