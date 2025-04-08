import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  createWSClient,
  wsLink,
} from "@trpc/client";
import { useState } from "react";
import { TRPCProvider } from "@/helpers/trpc";
import type { AppRouter } from "@/server/trpc/router";
import { usePageContext } from "vike-react/usePageContext";
import { wsUrl } from "@/server/trpc/wsServer";

const makeQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
};
let browserQueryClient: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  //
  const queryClient = getQueryClient();
  const wsClient = createWSClient({
    url: wsUrl,
  });

  //
  const {
    injected: { tRPCUrl },
  } = usePageContext();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: tRPCUrl,
        }),
        wsLink({
          client: wsClient,
        }),
      ],
    }),
  );

  //
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
};

export default Wrapper;
