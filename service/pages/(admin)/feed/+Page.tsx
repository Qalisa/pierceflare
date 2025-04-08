import ReloadButton from "@/components/ReloadButton";
import WebSocketIndicator from "@/components/WebSocketIndicator";
import { useTRPC, useTRPCClient } from "@/helpers/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/solid";
import { useSubscription } from "@trpc/tanstack-react-query";
import type { InferSelectModel } from "drizzle-orm";

//
//
//

//
const FlaresFeedPage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  //
  const invalidateFlares = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: trpc.getFlares.queryKey(),
      }),
    [queryClient, trpc],
  );

  //
  const { data: flares } = useQuery(trpc.getFlares.queryOptions());
  const { status, data } = useSubscription(
    trpc.onFlaresUpdates.subscriptionOptions(),
  );

  //
  useEffect(() => {
    invalidateFlares();
  }, [data]);

  //
  return (
    <div className="w-11/12">
      <div className="mx-4 flex items-center gap-4">
        <ReloadButton action={invalidateFlares} />
        <WebSocketIndicator status={status} />
        {import.meta.env.DEV && (
          <FlareGeneratorCommandBelt forceInvalidation={invalidateFlares} />
        )}
      </div>
      <div className="divider"></div>
      {flares?.map((e) => <span key={e.receivedAt}>{JSON.stringify(e)}</span>)}
    </div>
  );
};

//
//
//

const FlareGeneratorCommandBelt = ({
  forceInvalidation,
}: {
  forceInvalidation: () => void;
}) => {
  //
  const trpc = useTRPC();
  const trpcCli = useTRPCClient();

  const { data: domains } = useQuery(trpc.getFlareDomains.queryOptions());
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );

  //
  useEffect(() => {
    if (domains && domains.length && !selectedOption) {
      setSelectedOption(domains[0].ddnsForDomain);
    }
  }, [selectedOption, domains]);

  //
  return (
    <div className="join join-vertical">
      <select
        className="select select-xs join-item"
        value={selectedOption}
        disabled={domains == undefined || domains.length == 0}
        onChange={(e) => setSelectedOption(e.target.value)}
      >
        {domains == undefined ? (
          <option>Loading...</option>
        ) : domains.length ? (
          domains.map((e) => (
            <option key={e.ddnsForDomain}>{e.ddnsForDomain}</option>
          ))
        ) : (
          <option>No domain yet !</option>
        )}
      </select>
      <div className="join join-horizontal join-item">
        <button
          className="btn btn-xs join-item flex-auto"
          disabled={selectedOption == undefined}
          onClick={async () => {
            await trpcCli.sendTestFlare.query({ ofDomain: selectedOption! });
          }}
        >
          Generate Flare
        </button>
        <button
          onClick={async () => {
            await trpcCli.deleteAllFlares.query();
            forceInvalidation();
          }}
          className="btn btn-xs btn-error join-item"
        >
          <TrashIcon className="size-3" />
          All
        </button>
      </div>
    </div>
  );
};

export default FlaresFeedPage;
