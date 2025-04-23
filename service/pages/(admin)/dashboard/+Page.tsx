import appLogo from "#/assets/images/logo.webp";

import { PlusCircleIcon } from "@heroicons/react/24/solid";

import { getModal, modalIds } from "#/helpers/modals";
import { title } from "#/helpers/static";

import CreateDDNSEntryModal from "./modals/CreateDDNSEntry";
import DeleteDDNSEntriesModal from "./modals/DeleteDDNSEntries";
import ManageAPIKeysModal from "./modals/ManageAPIKeys";
import DNSEntriesTable from "./tables/DNSEntriesTable";

//
const DashboardPage = () => {
  //
  return (
    <>
      <DashboardModals />
      <DNSEntriesTable noData={<HeroNoDDNS />} />
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
