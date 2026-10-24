"use client";

import React from "react";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemType: "skill" | "achievement";
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  itemType,
  itemName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="purge-dialog-title"
      data-ascii="skip"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
    >
      <div
        data-ascii="skip"
        className="w-full max-w-md bg-eva-charcoal border border-eva-red p-6 text-white shadow-2xl relative"
      >
        {/* Warning Badge */}
        <div className="flex items-center gap-2 text-eva-red font-mono text-xs tracking-wider uppercase mb-2">
          <span className="inline-block w-2 h-2 bg-eva-red animate-pulse" />
          <span>PURGE PROTOCOL // WARNING</span>
        </div>

        <h3
          id="purge-dialog-title"
          className="font-exo2 text-lg sm:text-xl font-bold tracking-wide text-white mb-2"
        >
          CONFIRM {itemType.toUpperCase()} PURGE
        </h3>

        <p className="font-mono text-xs text-eva-text-muted mb-6 leading-relaxed">
          Are you sure you want to permanently delete{" "}
          <span className="text-white font-semibold">&quot;{itemName}&quot;</span>? This
          operation cannot be undone and purges the document from active database
          indices.
        </p>

        <div className="flex items-center justify-end gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            data-ascii="skip"
            className="px-4 py-1.5 border border-white/30 text-white/80 hover:text-white hover:border-white transition-colors uppercase cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            data-ascii="skip"
            className="px-4 py-1.5 bg-eva-red hover:bg-[#b0220c] disabled:opacity-50 text-white font-bold transition-colors uppercase cursor-pointer"
          >
            {isDeleting ? "PURGING..." : "PURGE RECORD"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
