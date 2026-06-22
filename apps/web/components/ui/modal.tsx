import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 p-4 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-[oklch(0.92_0_0)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[oklch(0.96_0_0)]">
          <h3 className="text-lg font-bold text-[oklch(0.22_0_0)] lowercase">{title}</h3>
          <button
            onClick={onClose}
            className="text-[oklch(0.45_0_0)] hover:text-[oklch(0.22_0_0)] text-2xl leading-none transition-colors"
          >
            ÃƒÆ’Ã¢â‚¬â€
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 p-6 border-t border-[oklch(0.96_0_0)] bg-[oklch(0.98_0_0)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};


