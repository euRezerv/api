import log from "@utils/logger";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { version } from "../../package.json";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "euRezerv API",
      version: version,
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication and Authorization" },
      { name: "Users", description: "User-related operations" },
      { name: "Companies", description: "Company-related operations" },
      { name: "Resources", description: "Resource-related operations" },
      { name: "Services", description: "Service-related operations" },
      { name: "Bookings", description: "Booking-related operations" },
    ],
  },
  apis: ["src/routes/v1/**/*.ts"],
};

const specs = swaggerJSDoc(options);

export default (app: Express, port: number) => {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
  log.info(`Swagger is running at ${process.env.URL}:${port}/docs`);
};
