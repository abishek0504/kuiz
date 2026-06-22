import { useEffect, useState, type ReactNode } from "react";
import { Settings } from "lucide-react";
import { BottomTabs } from "./BottomTabs";
import type { MainTab } from "../engine/tabs";

type AppShellProps = {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  children: ReactNode;
};

export function AppShell({ currentTab, onTabChange, children }: AppShellProps) {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    function updateOnlineStatus() {
      setOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <button type="button" className="brand-button" onClick={() => onTabChange("home")}>
          <span className="brand-mark">A</span>
          <span>Kuiz</span>
        </button>
        {!online ? (
          <span className="network-pill" role="status" aria-label="Network status">
            Offline ready
          </span>
        ) : null}
        <button
          type="button"
          className="icon-button"
          aria-label="Settings"
          title="Settings"
          onClick={() => onTabChange("settings")}
        >
          <Settings size={19} aria-hidden="true" />
        </button>
      </header>
      <main className="screen">{children}</main>
      <BottomTabs current={currentTab} onChange={onTabChange} />
    </div>
  );
}
