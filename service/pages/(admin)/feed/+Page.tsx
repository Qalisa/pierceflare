import ReloadButton from "@/components/ReloadButton";
import { useWebSocket } from "@/providers/websocket/useWebSocket";
import WebSocketIndicator from "@/components/WebSocketIndicator";
import { useTRPC, useTRPCClient } from "@/helpers/trpc";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import {
  notifyTableStaleness,
  unsetStaleness,
} from "@/store/reducers/staleness";
import { useEffect } from "react";
import type { RootState } from "@/store/reducers";

//
const FlaresFeedPage = () => {
  const trpc = useTRPC();
  const trpcCli = useTRPCClient();
  const dispatch = useDispatch();
  const isStale = useSelector(
    (state: RootState) => state.staleness.tableStaleness.flares,
  );
  const { data: flares, refetch } = useQuery(trpc.getFlares.queryOptions());
  const { data: apiKeys } = useQuery(trpc.getApiKeys.queryOptions());

  const { websocket } = useWebSocket();
  if (websocket) {
    websocket.onmessage = () => {
      dispatch(notifyTableStaleness("flares"));
    };
  }

  useEffect(() => {
    if (isStale) {
      refetch().then(() => dispatch(unsetStaleness("flares")));
    }
  }, [isStale]);

  return (
    <div className="w-11/12">
      <div className="mx-4 flex items-center gap-4">
        <ReloadButton action={() => dispatch(notifyTableStaleness("flares"))} />
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
