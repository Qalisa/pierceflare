import { createContext } from "react";
import type { WebSocketContextType } from "./WebSocketProvider";

export const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);
