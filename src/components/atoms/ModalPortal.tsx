"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface ModalPortalProps {
  isOpen: boolean;
  children: React.ReactNode;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({ isOpen, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isOpen) return;

    // Save previous overflow style to restore when modal closes
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted, isOpen]);

  if (!mounted || !isOpen) {
    return null;
  }

  return createPortal(children, document.body);
};
