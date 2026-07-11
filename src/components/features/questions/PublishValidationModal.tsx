"use client";

import React from "react";
import { ModalPortal } from "@/components/atoms/ModalPortal";

export interface PublishValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestionNow: () => void;
}

export const PublishValidationModal: React.FC<PublishValidationModalProps> = ({
  isOpen,
  onClose,
  onAddQuestionNow,
}) => {

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[1050]">
        <div className="modal-content card animate-fade-in w-full max-w-[420px] p-6 text-center bg-secondary border border-warning/35 shadow-2xl shadow-warning/20">
          <div className="w-11 h-11 rounded-xl bg-warning/15 text-amber-400 flex items-center justify-center text-2xl font-black mx-auto mb-3 border border-warning/35">
            !
          </div>
          <h3 className="text-lg font-extrabold mb-1.5 text-foreground">
            Cannot Publish Quiz
          </h3>
          <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
            You must add at least <strong className="text-foreground">1 question</strong> before publishing this
            quiz. Students cannot take an empty assessment!
          </p>
          <button
            onClick={() => {
              onClose();
              onAddQuestionNow();
            }}
            className="btn btn-primary w-full py-3.5 shadow-md shadow-primary/30 font-semibold"
          >
            Add Question Now
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
