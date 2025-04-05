import { useContext } from "react";
import { WebSocketContext } from "./WebSocketContext";
import type { WebSocketContextType } from "./WebSocketProvider";

// Hook for easy usage
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    return {
      connectionState: "pending",
      websocket: null,
    } satisfies WebSocketContextType;
    // throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
