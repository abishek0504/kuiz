type ChipTabsProps<T extends string> = {
  label: string;
  items: Array<{ id: T; label: string }>;
  current: T;
  onChange: (id: T) => void;
};

export function ChipTabs<T extends string>({ label, items, current, onChange }: ChipTabsProps<T>) {
  return (
    <div className="chip-row" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === current}
          className={item.id === current ? "chip active" : "chip"}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
