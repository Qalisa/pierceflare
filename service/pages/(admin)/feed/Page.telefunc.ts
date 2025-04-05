import { onlyLoggedUser } from "@/helpers/telefunc";
import { broadcastToWSClients } from "@/server";

export const onPushMessage = () => {
  onlyLoggedUser();
  broadcastToWSClients("ok");
};
