import React from "react";

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: number;
  gap?: number;
  className?: string;
}

export const ResponsiveGrid = ({
  children,
  cols = 4,
  gap = 6,
  className = "",
}: ResponsiveGridProps) => {
  const gridClasses = \grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-\ gap-\ \\;

  return <div className={gridClasses}>{children}</div>;
};
