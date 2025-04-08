import { useTRPC, useTRPCClient } from "@/helpers/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/solid";
import FlaresTable from "./tables/FlaresTable";
import appLogo from "@/assets/images/logo.webp";
import { cliTitle } from "@/helpers/static";

//
//
//

//
const FlaresFeedPage = () => {
  //
  return (
    <FlaresTable
      noData={<HeroNoFlares />}
      belt={import.meta.env.DEV ? <FlareGeneratorCommandBelt /> : undefined}
    />
  );
};

//
//
//

const HeroNoFlares = () => {
  //
  return (
    <div className="hero mt-8">
      <div className="hero-content text-center">
        <div>
          <img
            src={appLogo}
            className="size-2/12 place-self-center self-center"
            alt=""
          />
          <br />
          <h1 className="text-3xl font-bold">No Flares received yet.</h1>
          <p className="py-6">
            Please use <strong>{cliTitle}</strong> against one of the configured
            DDNS.
          </p>
          <br />
          <div className="mockup-code text-left">
            <pre data-prefix="">
              <code style={{ color: "green" }}>
                # within <strong>{cliTitle}</strong> container&apos;s
                interactive shell
              </code>
            </pre>
            <pre data-prefix="$">
              <code>./pierceflare-cli.sh --force-ping</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

//
//
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

export default FlaresFeedPage;
