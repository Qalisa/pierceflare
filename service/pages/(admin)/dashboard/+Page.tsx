import { routes } from "@/server/app";

const DashboardPage = () => {
  //
  return (
    <>
      <form action={routes.api.logout} method="post">
        <input type="submit" className="btn btn-primary" />
      </form>
    </>
  );
};

export default DashboardPage;
