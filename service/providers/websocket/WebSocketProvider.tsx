import { hc } from "hono/client";
import { useState, useEffect } from "react";
import { WebSocketContext } from "./WebSocketContext";

//
export type WebSocketContextType = {
  websocket: ReturnType<ReturnType<typeof hc>["ws"]["$ws"]> | null;
  connectionState: "yes" | "no" | "pending";
};

// WebSocketProvider component to manage the connection
export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // State to store the WebSocket object and connection status
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] =
    useState<WebSocketContextType["connectionState"]>("pending");

  // Effect to establish and clean up the WebSocket connection
  useEffect(() => {
    // Initialize the Hono client and get the WebSocket object

    const client = hc(window.location.origin);
    const websocket = client.ws.$ws(0);
    setWs(websocket);

    // Event handlers for connection status
    const handleOpen = () => setConnectionState("yes");
    const handleClose = () => setConnectionState("no");

    // Set up event listeners
    websocket.addEventListener("open", handleOpen);
    websocket.addEventListener("close", handleClose);

    // Cleanup function to close the connection and remove listeners
    return () => {
      websocket.close();
      websocket.removeEventListener("open", handleOpen);
      websocket.removeEventListener("close", handleClose);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Provide the WebSocket object and connection status to children
  return (
    <WebSocketContext.Provider value={{ websocket: ws, connectionState }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
