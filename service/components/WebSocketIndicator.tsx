import useWebSocket, { ReadyState } from "react-use-websocket";

//
const WebSocketIndicator = () => {
  const { readyState } = useWebSocket("ws://localhost:3000");

  //
  const status = (() => {
    switch (readyState) {
      case ReadyState.OPEN:
        return "status-success";
      case ReadyState.CLOSED:
      case ReadyState.CLOSING:
        return "status-error";
      case ReadyState.CONNECTING:
        return "status-warning";
      case ReadyState.UNINSTANTIATED:
        return "status-secondary";
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
