import { Provider } from "react-redux";
import { usePageContext } from "vike-react/usePageContext";

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const { store } = usePageContext();
  return <Provider store={store}>{children}</Provider>;
};

export default Wrapper;
