import EventEmitter from "events";

//
//
//

export const wsBroadcaster = new EventEmitter();

export const broadcastToWSClients = (message: string) => {
  wsBroadcaster.emit("all", message);
};
