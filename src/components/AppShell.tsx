import type { ReactNode } from "react";
import { Settings } from "lucide-react";
import { BottomTabs } from "./BottomTabs";
import type { MainTab } from "../engine/tabs";

type AppShellProps = {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  children: ReactNode;
};

export function AppShell({ currentTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <button type="button" className="brand-button" onClick={() => onTabChange("home")}>
          <span className="brand-mark">A</span>
          <span>Kuiz</span>
        </button>
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
