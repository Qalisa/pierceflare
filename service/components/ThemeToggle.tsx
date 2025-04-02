import { useEffect, useState, useSyncExternalStore } from "react";

const key = "enforceReverseOsTheme";
const eventKey = "storage";

const getSnapshot = () => {
  const current = localStorage.getItem(key);
  return current === "true";
};

const getServerSnapshot = () => {
  return false;
};

const ThemeToggler = () => {
  const doEnforceReverseOSTheme = useSyncExternalStore(
    (callback) => {
      window.addEventListener(eventKey, callback);
      return () => window.removeEventListener(eventKey, callback);
    },
    getSnapshot,
    getServerSnapshot,
  );

  //
  const toggleEnforceReverseOSTheme = () => {
    const newValue = JSON.stringify(!doEnforceReverseOSTheme);
    localStorage.setItem(key, newValue);
    window.dispatchEvent(new Event(eventKey)); // 🔥 Force re-render
  };

  // Default to `null` to avoid hydration mismatch
  const [currentOSThemeIsDark, setCurrentOSThemeIsDark] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleThemeChange = (event: MediaQueryListEvent) => {
      setCurrentOSThemeIsDark(event.matches);
    };

    // Set initial theme
    setCurrentOSThemeIsDark(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleThemeChange);

    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, []);

  //
  const targetThemeToogler = !currentOSThemeIsDark ? "business" : "corporate";

  return (
    <label className="flex cursor-pointer gap-2">
      {currentOSThemeIsDark ? <Moon /> : <Sun />}
      <input
        type="checkbox"
        value={targetThemeToogler}
        className="toggle theme-controller"
        checked={doEnforceReverseOSTheme}
        onChange={toggleEnforceReverseOSTheme}
      />
      {!currentOSThemeIsDark ? <Moon /> : <Sun />}
    </label>
  );
};

//
const Sun = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
);

//
const Moon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

export default ThemeToggler;
