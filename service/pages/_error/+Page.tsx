import { usePageContext } from "vike-react/usePageContext";

const ErrorPage = () => {
  const { is404 } = usePageContext();

  const getContent = (() => {
    switch (is404) {
      case true:
        return {
          message: "Woops ! Page not found :(",
          description:
            "You are trying to access a page that did or never existed.",
        };
      default:
        return {
          message: "Seems like a technical problem occured...",
          description: "Please try later.",
        };
    }
  })();

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <ErrorMessage {...getContent} />
    </div>
  );
};

const ErrorMessage = ({
  message,
  description,
}: {
  message: string;
  description: string;
}) => {
  return (
    <>
      <div className="hero">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">{message}</h1>
            <p className="py-6">{description}</p>
            <a href="/">
              <button className="btn btn-primary">
                Go back to known territories
              </button>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorPage;
