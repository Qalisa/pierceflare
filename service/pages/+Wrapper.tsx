import { Provider } from "react-redux";
import { usePageContext } from "vike-react/usePageContext";

import { ThemeProvider } from "#/providers/theme/ThemeProvider";

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const { store } = usePageContext();
  return (
    <ThemeProvider>
      <Provider store={store}>{children}</Provider>
    </ThemeProvider>
  );
};

export default Wrapper;
