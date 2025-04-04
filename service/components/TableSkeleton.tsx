const TableSkeleton = () => (
  <table className="table w-full">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div className="skeleton h-4 w-32"></div>
        </td>
        <td>
          <div className="skeleton h-4 w-48"></div>
        </td>
        <td>
          <div className="skeleton h-4 w-20"></div>
        </td>
      </tr>
      <tr>
        <td>
          <div className="skeleton h-4 w-32"></div>
        </td>
        <td>
          <div className="skeleton h-4 w-48"></div>
        </td>
        <td>
          <div className="skeleton h-4 w-20"></div>
        </td>
      </tr>
      <tr>
        <td>
          <div className="skeleton h-4 w-32"></div>
        </td>
        <td>
          <div className="skeleton h-4 w-48"></div>
        </td>
        <td>
          <div className="skeleton h-4 w-20"></div>
        </td>
      </tr>
    </tbody>
  </table>
);

export default TableSkeleton;
