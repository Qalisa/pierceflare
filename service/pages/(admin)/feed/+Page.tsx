import { useData } from "vike-react/useData";
import type { DataType } from "./+data";
import ReloadButton from "@/components/ReloadButton";
import { useWebSocket } from "@/providers/websocket/useWebSocket";
import WebSocketIndicator from "@/components/WebSocketIndicator";

//
const FlaresFeedPage = () => {
  const { apiKeys, flares } = useData<DataType>();
  const { connectionState, websocket } = useWebSocket();

  return (
    <div className="w-11/12">
      <div className="mx-4 flex gap-4">
        <ReloadButton />
        <WebSocketIndicator />
      </div>
      <div className="divider"></div>
      {apiKeys.map((e) => (
        <span key={e.createdAt.toISOString()}>{JSON.stringify(e)}</span>
      ))}
      <div className="divider"></div>
      {flares.map((e) => (
        <span key={e.receivedAt.toISOString()}>{JSON.stringify(e)}</span>
      ))}
    </div>
  );
};

export default FlaresFeedPage;
