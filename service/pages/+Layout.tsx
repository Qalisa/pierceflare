import "@/style/global.css";
import "@/style/tailwind.css";
import { usePageContext } from "vike-react/usePageContext";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { authFailureMessages } = usePageContext();

  return (
    <>
      {authFailureMessages && (
        <div className="absolute top-0 flex w-full flex-col gap-1">
          {authFailureMessages.map((e, i) => (
            <Failure message={e} key={i} />
          ))}
        </div>
      )}
      <div id="app" data-theme="dark">
        {children}
      </div>
    </>
  );
};

const Failure = ({ message }: { message: string }) => (
  <div role="alert" className="alert alert-error m-4">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 shrink-0 stroke-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span>{message}</span>
  </div>
);

export default Layout;
