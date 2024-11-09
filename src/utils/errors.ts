import log from "./logger";

export const normalizeError = (error: unknown): Error => {
  if (typeof error === "string") {
    return new Error(error);
  } else if (error instanceof Error) {
    return error;
  } else {
    log.error("Unknown error type", error);
    return new Error("Unknown error type");
  }
};
