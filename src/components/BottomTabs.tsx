import { mainTabs } from "../app/routes";
import { isActiveMainTab, type MainTab } from "../engine/tabs";

type BottomTabsProps = {
  current: MainTab;
  onChange: (tab: MainTab) => void;
};

export function BottomTabs({ current, onChange }: BottomTabsProps) {
  return (
    <nav className="bottom-tabs" aria-label="Main">
      {mainTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={isActiveMainTab(current, tab.id) ? "bottom-tab active" : "bottom-tab"}
          aria-current={isActiveMainTab(current, tab.id) ? "page" : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
