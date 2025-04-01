import { usePageContext } from "vike-react/usePageContext";

const ErrorPage = () => {
  const { is404 } = usePageContext();

  const getContent = (() => {
    switch (is404) {
      case true:
        return {
          message: "Oups, cette page n'existe pas !",
          description:
            "Vous vous êtes perdu, il y a surement eu un problème de navigation. Rassurez-vous, rien de très grave.",
        };
      default:
        return {
          message: "Il semblerait qu'il y ait eu un problème technique...",
          description:
            "Désolé pour cet impair, nos équipes techniques sont surement en train de corriger le problème. Merci de réessayer + tard.",
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
                Revenez en territoire connu
              </button>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorPage;
