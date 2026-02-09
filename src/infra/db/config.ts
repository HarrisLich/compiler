import type { Knex } from "knex";
import { config } from "@infra/config";

export const dbConfig: { [key: string]: Knex.Config; } = {
  development: {
    client: "pg",
    connection: config.pg.databaseUrl || config.pg.main,
    migrations: {
      tableName: "knex_migrations",
      directory: "./src/infra/db/migrations",
    },
    seeds: {
      directory: "./src/infra/db/seeds",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  staging: {
    client: "pg",
    connection: config.pg.databaseUrl || config.pg.main,
    migrations: {
      tableName: "knex_migrations",
      directory: "./src/infra/db/migrations",
    },
    seeds: {
      directory: "./src/infra/db/seeds",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  production: {
    client: "pg",
    connection: config.pg.databaseUrl || config.pg.main,
    migrations: {
      tableName: "knex_migrations",
      directory: "./src/infra/db/migrations",
    },
    seeds: {
      directory: "./src/infra/db/seeds",
    },
    pool: {
      min: 10,
      max: 30,
    },
  },
};