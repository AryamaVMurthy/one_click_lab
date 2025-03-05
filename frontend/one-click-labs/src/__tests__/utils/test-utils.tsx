import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider } from '@/context/AuthContext';

// All providers that your components need during testing should be added here
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

// Custom render function that wraps components with all necessary providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method with our custom version
export { customRender as render, screen, waitFor, fireEvent };
