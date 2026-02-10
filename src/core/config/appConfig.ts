import type { AppConfig } from "./types";

export const appConfig: AppConfig = {
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  logger: {
    level: process.env["LOG_LEVEL"] ?? "info",
    serviceName: process.env["SERVICE_NAME"] ?? "compiler",
  },
};
