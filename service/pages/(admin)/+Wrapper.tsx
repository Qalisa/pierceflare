import { clientOnly } from "vike-react/clientOnly";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { TRPCProvider } from "@/helpers/trpc";
import type { AppRouter } from "@/server/trpc/router";
import { usePageContext } from "vike-react/usePageContext";

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

const WebSocketProvider = clientOnly(
  () => import("@/providers/websocket/WebSocketProvider"),
);

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  //
  const {
    injected: { tRPCUrl },
  } = usePageContext();
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: tRPCUrl,
        }),
      ],
    }),
  );

  //
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <WebSocketProvider fallback={children}>{children}</WebSocketProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
};

export default Wrapper;
