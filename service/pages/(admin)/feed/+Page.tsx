import ReloadButton from "@/components/ReloadButton";
import WebSocketIndicator from "@/components/WebSocketIndicator";
import { useTRPC, useTRPCClient } from "@/helpers/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/solid";

//
//
//

//
const FlaresFeedPage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidateFlares = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: trpc.getFlares.queryKey(),
      }),
    [queryClient, trpc],
  );

  const { data: flares } = useQuery(trpc.getFlares.queryOptions());
  const { data: apiKeys } = useQuery(trpc.getApiKeys.queryOptions());

  return (
    <div className="w-11/12">
      <div className="mx-4 flex items-center gap-4">
        <ReloadButton action={invalidateFlares} />
        <WebSocketIndicator />
        <FlareGeneratorCommandBelt invalidateFlares={invalidateFlares} />
      </div>
      <div className="divider"></div>
      {apiKeys?.map((e) => <span key={e.createdAt}>{JSON.stringify(e)}</span>)}
      <div className="divider"></div>
      {flares?.map((e) => <span key={e.receivedAt}>{JSON.stringify(e)}</span>)}
    </div>
  );
};

const FlareGeneratorCommandBelt = ({
  invalidateFlares,
}: {
  invalidateFlares: () => void;
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
    if (domains && !selectedOption) {
      setSelectedOption(domains[0].ddnsForDomain);
    }
  }, [selectedOption, domains]);

  //
  return (
    <div className="join join-vertical">
      <select
        className="select select-xs join-item"
        value={selectedOption}
        onChange={(e) => setSelectedOption(e.target.value)}
      >
        {domains?.map((e) => (
          <option key={e.ddnsForDomain}>{e.ddnsForDomain}</option>
        ))}
      </select>
      <div className="join join-horizontal join-item">
        <button
          className="btn btn-xs join-item flex-auto"
          disabled={selectedOption == undefined}
          onClick={async () => {
            await trpcCli.sendTestFlare.query({ ofDomain: selectedOption! });
            invalidateFlares();
          }}
        >
          Generate Flare
        </button>
        <button
          onClick={async () => {
            await trpcCli.deleteAllFlares.query();
            invalidateFlares();
          }}
          className="btn btn-xs btn-error join-item"
        >
          <TrashIcon className="size-2" />
        </button>
      </div>
    </div>
  );
};

export default FlaresFeedPage;
