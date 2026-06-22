import React from 'react';

type StatusType = 'draft' | 'confirmed' | 'received' | 'paid' | 'unpaid' | 'partially_paid' | 'in_progress' | 'completed';

const STATUS_MAP: Record<StatusType, { label: string, bg: string, color: string }> = {
  draft: { label: 'Brouillon', bg: '#f1f5f9', color: '#475569' },
  confirmed: { label: 'ConfirmÃƒÆ’Ã‚Â©', bg: '#ecfdf5', color: '#059669' },
  received: { label: 'RÃƒÆ’Ã‚Â©ceptionnÃƒÆ’Ã‚Â©', bg: '#dcfce7', color: '#166534' },
  partially_paid: { label: 'Partiel', bg: '#fef3c7', color: '#d97706' },
  paid: { label: 'PayÃƒÆ’Ã‚Â©', bg: '#dcfce7', color: '#166534' },
  unpaid: { label: 'ImpayÃƒÆ’Ã‚Â©', bg: '#fee2e2', color: '#dc2626' },
  in_progress: { label: 'En cours', bg: '#eff6ff', color: '#2563eb' },
  completed: { label: 'TerminÃƒÆ’Ã‚Â©', bg: '#f5f3ff', color: '#7c3aed' },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_MAP[status as StatusType] || { label: status, bg: '#eee', color: '#333' };

  return (
    <span style={{
      backgroundColor: config.bg,
      color: config.color,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      display: 'inline-block'
    }}>
      {config.label}
    </span>
  );
};
