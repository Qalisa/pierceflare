import { onlyLoggedUser } from "@/helpers/telefunc";
import { cfWorker } from "@/server/cfWorker";
import { broadcastToWSClients } from "@/server/ws";

export const onTestPushMessage = async () => {
  onlyLoggedUser();
  broadcastToWSClients("ok");
  cfWorker.queueDNSUpdate({
    operation: "update",
    record: {
      fullName: "test.ivy.community",
      type: "A",
      proxied: true,
      content: "1.1.1.1",
    },
  });
};
