"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import { createPortal } from "react-dom";

interface DeployConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: () => void;
  title?: string;
  message?: string;
  isDeploying?: boolean;
}

export default function DeployConfirmationModal({
  isOpen,
  onClose,
  onDeploy,
  title = "Deploy Lab",
  message = "Are you sure you want to deploy this lab? Once deployed, it will be publicly accessible.",
  isDeploying = false,
}: DeployConfirmationModalProps) {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle keyboard events (Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus inside the modal
  useEffect(() => {
    if (!isOpen) return;
    
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements?.length) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    firstElement.focus();
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  // Use createPortal to render at the root level
  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {/* Modal container */}
      <div 
        ref={modalRef}
        className={`relative w-full max-w-md rounded-lg p-6 shadow-xl ${
          theme === "dark" ? "bg-card text-foreground" : "bg-white text-gray-800"
        }`}
      >
        {/* Modal header */}
        <h2 
          id="modal-title" 
          className="text-xl font-bold mb-4"
        >
          {title}
        </h2>
        
        {/* Modal content */}
        <div className="mb-6">
          <p>{message}</p>
          {isDeploying && (
            <div className="mt-4 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
              <span>Deploying your lab...</span>
            </div>
          )}
        </div>
        
        {/* Modal actions */}
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose}
            className={`px-4 py-2 border rounded-md ${
              theme === "dark" 
                ? "border-gray-600 hover:bg-gray-800" 
                : "border-gray-300 hover:bg-gray-100"
            }`}
            disabled={isDeploying}
          >
            Cancel
          </button>
          <button 
            onClick={onDeploy}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            disabled={isDeploying}
          >
            {isDeploying ? "Deploying..." : "Deploy"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
