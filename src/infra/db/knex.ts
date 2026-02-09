import type { Knex } from 'knex';
import knex from 'knex';
import { dbConfig } from '@infra/db/config';
import { ensureDbExist } from '@infra/db/initDb';
import { config } from '@infra/config';

let instance: Knex | null = null;

export const initializeDb = async () => {
  if (!instance) {
    await ensureDbExist();
    const env = config.nodeEnv ?? 'development';
    instance = await knex(dbConfig[env] as Knex.Config);
  }
  return instance;
};