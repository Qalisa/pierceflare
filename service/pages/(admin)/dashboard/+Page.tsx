import { usePageContext } from "vike-react/usePageContext";
import DNSEntriesTable from "./tables/DNSEntries";
import { useData } from "vike-react/useData";
import type { DataType } from "./+data.client";
import { title } from "@/helpers/static";
import CreateDDNSEntryModal, { openModal } from "./modals/CreateDDNSEntry";
import TableSkeleton from "@/components/TableSkeleton";

//
const DashboardPage = () => {
  //
  const { injected } = usePageContext();
  const { user } = injected;
  const data = useData<DataType>();

  //
  return (
    <>
      <DashboardModals />
      <h1>Hello {user!.username} !</h1>
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
    </>
  );
};

const HeroNoDDNS = () => {
  return (
    <div className="hero">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">No DDNS Entry yet !</h1>
          <p className="py-6">Please create one before using {title}</p>
          <button className="btn btn-primary" onClick={openModal}>
            Create DDNS Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
