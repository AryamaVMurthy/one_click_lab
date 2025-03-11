"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: "default" | "large" | "fullscreen";
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "default"
}: ModalProps) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Set width based on size prop
  let widthClass = "max-w-md"; // Default
  if (size === "large") widthClass = "max-w-4xl";
  if (size === "fullscreen") widthClass = "max-w-[95vw] h-[95vh]";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div 
        className={`bg-background rounded-lg shadow-lg ${widthClass} w-full mx-auto overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-border-color p-4">
          <h2 className="text-xl font-semibold">{title || "Modal"}</h2>
          <button 
            onClick={onClose} 
            className="text-secondary-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="overflow-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
