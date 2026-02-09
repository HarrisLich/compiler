import { createYoga } from 'graphql-yoga';
import express from 'express';
import type { Knex } from 'knex';
import { buildSchema } from './schema';
import { createContext } from './context';
/**
 * Mounts the GraphQL Yoga server onto the provided Express app at /graphql.
 */
export const mountGraphQL = (app: express.Express, db: Knex) => {
  const yoga = createYoga({
    graphqlEndpoint: '/graphql',
    schema: buildSchema(),
    context: createContext(db),
    maskedErrors: true,
  });

  app.use(yoga.graphqlEndpoint, yoga);
};