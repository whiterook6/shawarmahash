import dotenv from "dotenv";
import { isAbsolute } from "node:path";
import { join } from "node:path";

export type ENV = {
  GIT_HASH: string;
  NODE_ENV: "development" | "production";
  IDENTITY_SECRET: string;
  /** Path to the SQLite database file (absolute). Required. */
  DATABASE_PATH: string;
  /** Optional Healthchecks.io (or compatible) ping URL; if set, server pings it every minute */
  HEALTHCHECK_PING_URL?: string;
};

export const EnvController = {
  env: {} as ENV,
  verifyEnv: () => {
    dotenv.config();
    for (const key of [
      "GIT_HASH",
      "NODE_ENV",
      "IDENTITY_SECRET",
      "DATABASE_PATH",
    ]) {
      if (!process.env[key]) {
        throw new Error(`${key} is not set`);
      }
    }
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.NODE_ENV !== "production"
    ) {
      throw new Error(`NODE_ENV must be either development or production`);
    }
    const rawDbPath = process.env.DATABASE_PATH!;
    const databasePath = isAbsolute(rawDbPath)
      ? rawDbPath
      : join(process.cwd(), rawDbPath);

    EnvController.env = {
      GIT_HASH: process.env.GIT_HASH!,
      NODE_ENV: process.env.NODE_ENV!,
      IDENTITY_SECRET: process.env.IDENTITY_SECRET!,
      DATABASE_PATH: databasePath,
      ...(process.env.HEALTHCHECK_PING_URL && {
        HEALTHCHECK_PING_URL: process.env.HEALTHCHECK_PING_URL,
      }),
    };
  },
  printENV: () => {
    console.log(
      JSON.stringify(
        {
          GIT_HASH: EnvController.env.GIT_HASH,
          NODE_ENV: EnvController.env.NODE_ENV,
          IDENTITY_SECRET:
            EnvController.env.IDENTITY_SECRET.substring(0, 3) + "...",
          DATABASE_PATH: EnvController.env.DATABASE_PATH,
          HEALTHCHECK_PING_URL:
            EnvController.env.HEALTHCHECK_PING_URL ?? "not configured",
        },
        null,
        2,
      ),
    );
  },
  getEnv: () => {
    return EnvController.env;
  },
};
