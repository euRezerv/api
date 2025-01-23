import { createLogger, format, transports } from "winston";
import util from "util";

const { combine, timestamp, printf, colorize } = format;
const COLORS = {
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const logMessage = typeof message === "object" ? util.inspect(message, { depth: null, colors: true }) : message;
  const stackTrace = stack ? `\nStack Trace: ${stack}` : "";
  const requestURL =
    meta?.method && meta?.originalUrl ? ` [${COLORS.yellow}${meta.method} - ${meta.originalUrl}${COLORS.reset}]` : "";

  return `--> ${COLORS.blue}${timestamp}${COLORS.reset} [${level}]${requestURL}: ${logMessage} ${stackTrace}`;
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
