import type { Knex } from 'knex';

export type GraphQLContext = { db: Knex; };

/**
 * Factory to build the Yoga context per request.
 */
export const createContext = (db: Knex) => (): GraphQLContext => ({ db });