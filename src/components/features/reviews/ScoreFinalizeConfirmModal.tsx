"use client";

import React from "react";
import { ModalPortal } from "@/components/atoms/ModalPortal";

export interface ScoreFinalizeConfirmModalProps {
  isOpen: boolean;
  runningTotal: number;
  displayMax: number;
  isFinalizing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ScoreFinalizeConfirmModal: React.FC<
  ScoreFinalizeConfirmModalProps
> = ({
  isOpen,
  runningTotal,
  displayMax,
  isFinalizing,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[1050]">
        <div className="modal-content card animate-fade-in w-full max-w-[440px] p-7 text-center bg-secondary border border-success/35 shadow-2xl shadow-success/20">
          <div className="w-12 h-12 rounded-xl bg-success/15 text-success flex items-center justify-center text-xl font-black mx-auto mb-4 border border-success/35">
            ✓
          </div>
          <h3 className="text-xl font-extrabold mb-2 text-foreground">
            Finalize Exam Score?
          </h3>
          <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
            You are about to lock the final grade for this student attempt and make the results available.
          </p>

          <div className="p-4 bg-black/30 rounded-xl mb-6 border border-border">
            <div className="text-xs text-muted-foreground font-semibold mb-1 tracking-wider uppercase">
              FINAL SCORE TO BE AWARDED
            </div>
            <div className="font-extrabold text-success text-2xl">
              {runningTotal} / {displayMax} pts
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              disabled={isFinalizing}
              className="btn btn-secondary flex-1 py-3"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isFinalizing}
              className="btn flex-1 py-3 bg-gradient-to-br from-emerald-500 to-success text-white shadow-md shadow-success/30 font-semibold"
            >
              {isFinalizing ? "Finalizing..." : "Finalize Now"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
