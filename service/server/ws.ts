import EventEmitter from "events";

//
//
//

console.log("LOADED WS BROADCASTER");

export const wsBroadcaster = new EventEmitter();

export const broadcastToWSClients = (message: string) => {
  wsBroadcaster.emit("all", message);
};
