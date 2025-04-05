import { clientOnly } from "vike-react/clientOnly";

const WebSocketProvider = clientOnly(
  () => import("@/providers/websocket/WebSocketProvider"),
);

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return <WebSocketProvider fallback={children}>{children}</WebSocketProvider>;
};

export default Wrapper;
