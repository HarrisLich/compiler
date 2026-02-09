import { makeExecutableSchema } from '@graphql-tools/schema';

/**
 * Minimal starter schema. Extend with modules as we iterate.
 */
const typeDefs = /* GraphQL */ `
  type Query {
    _health: String!
  }
`;

const resolvers = {
  Query: {
    _health: () => 'ok',
  },
};

export const buildSchema = () => {
  return makeExecutableSchema({ typeDefs, resolvers });
};