import type { ServerWebSocket } from "bun";
import { createBunWebSocket } from "hono/bun";
import { EventEmitter } from "stream";

const { upgradeWebSocket, websocket: websocketServer } =
  createBunWebSocket<ServerWebSocket>();

//
export const prewarmWS = () => {
  return { websocketServer, upgradeWebSocket };
};

const wsBroadcaster = new EventEmitter();

const broadcastToWSClients = (message: string) => {
  wsBroadcaster.emit("all", message);
};

export { websocketServer, wsBroadcaster, broadcastToWSClients };
