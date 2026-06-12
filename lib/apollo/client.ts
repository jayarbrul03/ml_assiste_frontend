import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { GRAPHQL_URL } from "../types";

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  credentials: "include",
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
    query: { fetchPolicy: "network-only" },
  },
});
