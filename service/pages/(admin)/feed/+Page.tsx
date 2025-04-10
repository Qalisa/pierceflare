import FlaresTable from "./tables/FlaresTable";
import appLogo from "@/assets/images/logo.webp";
import { cliTitle } from "@/helpers/static";

//
//
//

//
const FlaresFeedPage = () => {
  //
  return <FlaresTable noData={<HeroNoFlares />} belt={undefined} />;
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

export default FlaresFeedPage;
