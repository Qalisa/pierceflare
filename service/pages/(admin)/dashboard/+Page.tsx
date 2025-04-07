import DNSEntriesTable from "./tables/DNSEntries";
import { title } from "@/helpers/static";
import CreateDDNSEntryModal from "./modals/CreateDDNSEntry";
import TableSkeleton from "@/components/TableSkeleton";
import DeleteDDNSEntriesModal from "./modals/DeleteDDNSEntries";
import { getModal, modalIds } from "@/helpers/modals";
import { PlusCircleIcon } from "@heroicons/react/24/solid";
import appLogo from "@/assets/images/logo.webp";
import ManageAPIKeysModal from "./modals/ManageAPIKeys";
import { useTRPC } from "@/helpers/trpc";
import { useQuery } from "@tanstack/react-query";

//
const DashboardPage = () => {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.hasAnyFlareDomains.queryOptions());
  //
  return (
    <>
      <DashboardModals />
      {data ? (
        data.hasEntries ? (
          <DNSEntriesTable />
        ) : (
          <HeroNoDDNS />
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
      <ManageAPIKeysModal />
    </>
  );
};

const HeroNoDDNS = () => {
  return (
    <div className="hero m-auto">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <img
            src={appLogo}
            className="size-4/12 place-self-center self-center"
            alt=""
          />
          <br />
          <h1 className="text-5xl font-bold">No DDNS Entry yet.</h1>
          <p className="py-6">Please create one before using {title}.</p>
          <button
            className="btn btn-primary"
            onClick={() => getModal(modalIds.createDDNS).openModal()}
          >
            <PlusCircleIcon className="size-4" />
            Create DDNS Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
