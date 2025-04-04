import { usePageContext } from "vike-react/usePageContext";
import DNSEntriesTable from "./DNSEntries";
import { useData } from "vike-react/useData";
import type { DataType } from "./+data.shared";
import { title } from "@/server/static";
import CreateDDNSEntryModal, { openModal } from "./modals/CreateDDNSEntry";

//
const DashboardPage = () => {
  //
  const { injected } = usePageContext();
  const { user } = injected;
  const { noEntries } = useData<DataType>();

  //
  return (
    <>
      <DashboardModals />
      <h1>Hello {user!.username} !</h1>
      {noEntries ? <HeroNoDDNS /> : <DNSEntriesTable />}
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
