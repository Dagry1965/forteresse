import React, { useState } from "react";

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultIndex?: number;
}

export const Tabs = ({ tabs, defaultIndex = 0 }: TabsProps) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <div>
      <div className="mb-6 flex border-b border-[oklch(0.92_0_0)]">
        {tabs.map((tab, index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={`${tab.label}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={[
                "px-6 py-3 text-sm font-semibold transition-all",
                isActive
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-black",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>{tabs[activeIndex]?.content}</div>
    </div>
  );
};
