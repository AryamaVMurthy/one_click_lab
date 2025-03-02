import { Lab, Section, Module } from './models';

// App-wide state interfaces
export interface AppState {
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // Duration in ms
}

// Lab editor state
export interface LabEditorState {
  lab: Lab | null;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  activeSection?: string; // ID of the currently active section
}

// UI states
export interface UiState {
  confirmationModal: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null;
  
  deployModal: {
    isOpen: boolean;
    isDeploying: boolean;
    error: string | null;
  };
}
