import ReloadButton from "@/components/ReloadButton";
import { useWebSocket } from "@/providers/websocket/useWebSocket";
import WebSocketIndicator from "@/components/WebSocketIndicator";
import { reload } from "vike/client/router";
import { useTRPC, useTRPCClient } from "@/helpers/trpc";
import { useQuery } from "@tanstack/react-query";

//
const FlaresFeedPage = () => {
  const trpc = useTRPC();
  const trpcCli = useTRPCClient();
  const { data: flares } = useQuery(trpc.getFlares.queryOptions());
  const { data: apiKeys } = useQuery(trpc.getApiKeys.queryOptions());

  const { websocket } = useWebSocket();
  if (websocket) {
    websocket.onmessage = () => {
      reload();
    };
  }

  return (
    <div className="w-11/12">
      <div className="mx-4 flex items-center gap-4">
        <ReloadButton />
        <WebSocketIndicator />
        <button
          className="btn"
          onClick={() => {
            trpcCli.sendTestFlare.query();
          }}
        >
          test
        </button>
      </div>
      <div className="divider"></div>
      {apiKeys?.map((e) => <span key={e.createdAt}>{JSON.stringify(e)}</span>)}
      <div className="divider"></div>
      {flares?.map((e) => <span key={e.receivedAt}>{JSON.stringify(e)}</span>)}
    </div>
  );
};

export default FlaresFeedPage;
