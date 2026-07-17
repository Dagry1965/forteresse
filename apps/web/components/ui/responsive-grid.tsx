import React from "react";

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: number;
  gap?: number;
  className?: string;
}

const colsClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
};

const gapClasses: Record<number, string> = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
};

export const ResponsiveGrid = ({
  children,
  cols = 4,
  gap = 6,
  className = "",
}: ResponsiveGridProps) => {
  const gridClasses = [
    "grid",
    colsClasses[cols] ?? colsClasses[4],
    gapClasses[gap] ?? gapClasses[6],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={gridClasses}>{children}</div>;
};
