import { onlyLoggedUser } from "@/helpers/telefunc";
import { broadcastToWSClients } from "@/server/ws";

export const onPushMessage = () => {
  onlyLoggedUser();
  broadcastToWSClients("ok");
};
