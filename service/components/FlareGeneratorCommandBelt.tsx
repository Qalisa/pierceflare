import { useTRPC, useTRPCClient } from "@/helpers/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/solid";

//
const FlareGeneratorCommandBelt = () => {
  //
  const trpc = useTRPC();
  const trpcCli = useTRPCClient();
  const queryClient = useQueryClient();

  //
  const invalidateFlares = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: trpc.getFlares.queryKey(),
      }),
    [queryClient, trpc],
  );

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
            invalidateFlares();
          }}
          disabled={domains == undefined}
          className="btn btn-xs btn-error join-item"
        >
          <TrashIcon className="size-3" />
          All
        </button>
      </div>
    </div>
  );
};

export default FlareGeneratorCommandBelt;
