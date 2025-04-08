import { useCallback, useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";

const STORAGE_KEY = "enforceReverseOsTheme";
const STORAGE_EVENT = "storage";

export type ThemeContextType = {
  doesOSPreferDark: boolean;
  toggleTheme: () => void;
  doEnforceReverseOSTheme: boolean;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize with default values for SSR
  const [doesOSPreferDark, setOSPrefersDark] = useState(false);
  const [doEnforceReverseOSTheme, setDoEnforceReverseOSTheme] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Apply theme to document based on current state
  const applyTheme = useCallback(
    (darkMode: boolean) => {
      if (!isClient) return;

      document.documentElement.dataset.theme = darkMode
        ? "business"
        : "corporate";
    },
    [isClient],
  );

  // Calculate theme based on OS preference and user settings
  const calculateTheme = useCallback(
    (prefersDark: boolean, enforceReverse: boolean) => {
      return enforceReverse ? !prefersDark : prefersDark;
    },
    [],
  );

  // Effect to initialize client-side state
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize theme once on client
  useEffect(() => {
    if (!isClient) return;

    // Get user preference from localStorage
    const enforceReverse = localStorage.getItem(STORAGE_KEY) === "true";
    setDoEnforceReverseOSTheme(enforceReverse);

    // Get OS preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    // Apply theme
    applyTheme(calculateTheme(prefersDark, enforceReverse));
    setOSPrefersDark(prefersDark);
  }, [isClient, applyTheme, calculateTheme]);

  // Listen for OS theme changes
  useEffect(() => {
    if (!isClient) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleThemeChange = (event: MediaQueryListEvent) => {
      setOSPrefersDark(event.matches);
      applyTheme(calculateTheme(event.matches, doEnforceReverseOSTheme));
    };

    mediaQuery.addEventListener("change", handleThemeChange);
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, [isClient, doEnforceReverseOSTheme, applyTheme, calculateTheme]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const newEnforceReverse = event.newValue === "true";
        setDoEnforceReverseOSTheme(newEnforceReverse);

        // Update theme based on new preference
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        applyTheme(calculateTheme(prefersDark, newEnforceReverse));
      }
    };

    window.addEventListener(STORAGE_EVENT, handleStorageChange);
    return () => window.removeEventListener(STORAGE_EVENT, handleStorageChange);
  }, [isClient, applyTheme, calculateTheme]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    if (!isClient) return;

    const newEnforceReverse = !doEnforceReverseOSTheme;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEnforceReverse));
    setDoEnforceReverseOSTheme(newEnforceReverse);

    // Update theme based on new preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    applyTheme(calculateTheme(prefersDark, newEnforceReverse));

    // Notify other tabs
    window.dispatchEvent(
      new StorageEvent(STORAGE_EVENT, {
        key: STORAGE_KEY,
        newValue: JSON.stringify(newEnforceReverse),
      }),
    );
  }, [isClient, doEnforceReverseOSTheme, applyTheme, calculateTheme]);

  return (
    <ThemeContext.Provider
      value={{ doesOSPreferDark, toggleTheme, doEnforceReverseOSTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
