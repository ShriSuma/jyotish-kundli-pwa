import type { ReactNode } from "react";

export type InsightTabId =
  | "overview"
  | "houses"
  | "doshas"
  | "marriage"
  | "family"
  | "longevity"
  | "remedies";

type Tab = { id: InsightTabId; label: string };

type Props = {
  tabs: Tab[];
  active: InsightTabId;
  onChange: (id: InsightTabId) => void;
  children: ReactNode;
};

export default function InsightTabPanel({ tabs, active, onChange, children }: Props): JSX.Element {
  return (
    <>
      <nav
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Life insights sections"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              className={`jk-btn shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium sm:text-sm ${
                isActive
                  ? "border-[color:var(--jk-accent)] bg-[color:var(--jk-accent-soft)] text-indigo-950"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-5">{children}</div>
    </>
  );
}
