import { onlyLoggedUser } from "@/helpers/telefunc";
import { cfEmitter } from "@/server/cloudflare/cfOrders";
import { broadcastToWSClients } from "@/server/ws";

export const onTestPushMessage = async () => {
  onlyLoggedUser();
  broadcastToWSClients("ok");
  console.log(cfEmitter);
  // cfEmitter.next({
  //   operation: "update",
  //   record: {
  //     fullName: "test.ivy.community",
  //     type: "A",
  //     proxied: true,
  //     content: "1.1.1.1",
  //   },
  // });
};
