import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-[oklch(0.6_0_0)]">{icon}</div>}
      <h3 className="text-lg font-bold text-[oklch(0.22_0_0)] mb-2">{title}</h3>
      {description && <p className="text-[oklch(0.45_0_0)] max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
