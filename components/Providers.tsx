"use client";

import { ApolloProvider } from "@apollo/client";
import { Provider } from "react-redux";
import { apolloClient } from "@/lib/apollo/client";
import { store } from "@/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </Provider>
  );
}
