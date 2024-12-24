import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, colorize } = format;
import util from "util";

const logFormat = printf(({ level, message, timestamp, stack }) => {
  const logMessage = typeof message === "object" ? util.inspect(message, { depth: null, colors: true }) : message;

  return `--> ${timestamp} [${level}]: ${logMessage} ${stack ? `\nStack Trace: ${stack}` : ""}`;
});

const log = createLogger({
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), colorize(), format.errors({ stack: true }), logFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/errors.log", level: "error" }),
    // new transports.File({ filename: "logs/combined.log" }), // Log all messages to file
  ],
});

export default log;
