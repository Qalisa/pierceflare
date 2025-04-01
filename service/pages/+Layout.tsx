import "@/style/global.css";
import "@/style/tailwind.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-theme="dark" className="relative w-full">
      {children}
    </div>
  );
};
export default Layout;
