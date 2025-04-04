import DNSEntriesTable from "./tables/DNSEntries";
import { useData } from "vike-react/useData";
import type { DataType } from "./+data";
import { title } from "@/helpers/static";
import CreateDDNSEntryModal from "./modals/CreateDDNSEntry";
import TableSkeleton from "@/components/TableSkeleton";
import DeleteDDNSEntriesModal from "./modals/DeleteDDNSEntries";
import { getModal, modalIds } from "@/helpers/modals";

//
const DashboardPage = () => {
  //
  const data = useData<DataType>();

  //
  return (
    <>
      <DashboardModals />
      {data ? (
        data.noEntries ? (
          <HeroNoDDNS />
        ) : (
          <DNSEntriesTable />
        )
      ) : (
        <TableSkeleton />
      )}
    </>
  );
};

//
const DashboardModals = () => {
  return (
    <>
      <CreateDDNSEntryModal />
      <DeleteDDNSEntriesModal />
    </>
  );
};

const HeroNoDDNS = () => {
  return (
    <div className="hero m-auto">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">No DDNS Entry yet !</h1>
          <p className="py-6">Please create one before using {title}</p>
          <button
            className="btn btn-primary"
            onClick={() => getModal(modalIds.createDDNS).openModal()}
          >
            Create DDNS Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
