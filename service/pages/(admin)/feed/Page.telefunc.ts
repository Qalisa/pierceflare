import { onlyLoggedUser } from "@/helpers/telefunc";
import { broadcastToWSClients } from "@/server/ws";

export const onTestPushMessage = async () => {
  onlyLoggedUser();
  broadcastToWSClients("ok");
};
