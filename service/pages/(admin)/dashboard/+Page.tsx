import { usePageContext } from "vike-react/usePageContext";
import { useData } from "vike-react/useData";
import { data } from "./+data";

const DashboardPage = () => {
  //
  const { injected } = usePageContext();
  const { user } = injected;

  //
  const { domains } = useData<Awaited<ReturnType<typeof data>>>();

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
