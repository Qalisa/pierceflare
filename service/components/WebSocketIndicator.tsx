import type { TRPCSubscriptionStatus } from "@trpc/tanstack-react-query";

//
const WebSocketIndicator = ({ status }: { status: TRPCSubscriptionStatus }) => {
  //
  const statusCss = (() => {
    switch (status) {
      case "pending":
      case "idle":
        return "status-success";
      case "error":
        return "status-error";
      case "connecting":
        return "status-warning";
    }
  })();

  //
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs">Live Updates</span>
      <div className="inline-grid *:[grid-area:1/1]">
        <div className={"status animate-ping " + statusCss}></div>
        <div className={"status " + statusCss}></div>
      </div>
    </div>
  );
};

export default WebSocketIndicator;
