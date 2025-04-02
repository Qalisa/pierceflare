import { routes } from "@/server/app";

const DashboardPage = () => {
  //
  return (
    <>
      <form action={routes.api.logout} method="post">
        <input type="submit" />
      </form>
    </>
  );
};

export default DashboardPage;
