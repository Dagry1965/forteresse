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
      <div className="flex border-b border-[oklch(0.92_0_0)] mb-6">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={\px-6 py-3 text-sm font-semibold transition-all \\}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[activeIndex]?.content}</div>
    </div>
  );
};
