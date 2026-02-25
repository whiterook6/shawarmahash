import dotenv from "dotenv";

export type ENV = {
  GIT_HASH: string;
  NODE_ENV: "development" | "production";
  IDENTITY_SECRET: string;
  /** Optional Healthchecks.io (or compatible) ping URL; if set, server pings it every minute */
  HEALTHCHECK_PING_URL?: string;
};

export const EnvController = {
  env: {} as ENV,
  verifyEnv: () => {
    dotenv.config();
    for (const key of ["GIT_HASH", "NODE_ENV", "IDENTITY_SECRET"]) {
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
    EnvController.env = {
      GIT_HASH: process.env.GIT_HASH!,
      NODE_ENV: process.env.NODE_ENV!,
      IDENTITY_SECRET: process.env.IDENTITY_SECRET!,
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
