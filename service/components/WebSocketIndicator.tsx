import { useWebSocket } from "@/providers/websocket/useWebSocket";

//
const WebSocketIndicator = () => {
  const { connectionState } = useWebSocket();

  //
  const status = (() => {
    switch (connectionState) {
      case "pending":
        return "status-secondary";
      case "yes":
        return "status-success";
      case "no":
        return "status-error";
    }
  })();

  //
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs">Live Updates</span>
      <div className="inline-grid *:[grid-area:1/1]">
        <div className={"status animate-ping " + status}></div>
        <div className={"status " + status}></div>
      </div>
    </div>
  );
};

export default WebSocketIndicator;
