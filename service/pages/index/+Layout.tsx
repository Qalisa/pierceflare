import ThemeToggler from "#/components/ThemeToggle";

//
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1"></div>
        <div className="flex-none">
          <ThemeToggler />
        </div>
      </div>
      <div className="flex flex-auto flex-col items-center justify-center">
        {children}
      </div>
    </>
  );
};

export default Layout;
