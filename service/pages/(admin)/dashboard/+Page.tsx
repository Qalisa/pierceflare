import { usePageContext } from "vike-react/usePageContext";

const DashboardPage = () => {
  //
  const { injected } = usePageContext();
  const { user } = injected;

  //
  return (
    <>
      <h1>Hello {user!.username} !</h1>
      <table className="table-xs table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Job</th>
            <th>company</th>
            <th>location</th>
            <th>Last Login</th>
            <th>Favorite Color</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </>
  );
};

export default DashboardPage;
