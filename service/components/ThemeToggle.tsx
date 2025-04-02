import { useTheme } from "@/providers/theme/useTheme";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

const ThemeToggler = () => {
  const { doesOSPreferDark, toggleTheme, doEnforceReverseOSTheme } = useTheme();

  return (
    <label className="flex cursor-pointer gap-2">
      <Icon showSun={doesOSPreferDark} />
      <input
        type="checkbox"
        className="toggle toggle-xs theme-controller"
        checked={doEnforceReverseOSTheme}
        onChange={toggleTheme}
      />
      <Icon showSun={!doesOSPreferDark} />
    </label>
  );
};

const Icon = ({ showSun }: { showSun: boolean }) => {
  //
  const size = "size-4";

  //
  return showSun ? <SunIcon className={size} /> : <MoonIcon className={size} />;
};
export default ThemeToggler;
