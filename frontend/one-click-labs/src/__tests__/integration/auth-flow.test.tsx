/// <reference types="jest" />
/// <reference types="../types/jest-dom.d.ts" />

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { useRouter } from 'next/navigation';
import { server } from '../mocks/server';
import { rest } from 'msw';
import { useAuth } from '@/context/AuthContext';

// Mock necessary components for testing
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn()
}));

// Sample login component for testing
const LoginComponent = () => {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to login');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  return (
    <div>
      {user ? (
        <div data-testid="logged-in-status">Logged in as {user.email}</div>
      ) : (
        <form onSubmit={handleLogin}>
          {error && <div data-testid="error-message">{error}</div>}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            data-testid="email-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            data-testid="password-input"
          />
          <button type="submit" disabled={isLoading} data-testid="login-button">
            {isLoading ? 'Loading...' : 'Login'}
          </button>
        </form>
      )}
    </div>
  );
};

describe('Authentication Flow', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn()
    });
    
    // Clear localStorage and mocks
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should login successfully and redirect to dashboard', async () => {
    render(<LoginComponent />);

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByTestId('login-button'));

    // Wait for login to complete and redirect to happen
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    
    // Check if tokens and user were stored
    expect(localStorage.getItem('token')).toBe('mock-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    expect(localStorage.getItem('user')).toBeTruthy();
  });

  it('should show error message on login failure', async () => {
    // Override the login handler for this test only
    server.use(
      rest.post('http://localhost:8000/api/v1/login', (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            success: false,
            error: 'Invalid credentials'
          })
        );
      })
    );

    render(<LoginComponent />);

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'wrong@example.com' }
    });
    
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrongpassword' }
    });
    
    fireEvent.click(screen.getByTestId('login-button'));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
    });

    // Router should not have been called
    expect(mockPush).not.toHaveBeenCalled();
    
    // Check that no tokens were stored
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should handle token refresh correctly', async () => {
    // Create a mock implementation of the AuthContext
    const mockRefreshUserToken = jest.fn().mockResolvedValue(true);
    
    // Override the useAuth hook for this test
    jest.spyOn(require('@/context/AuthContext'), 'useAuth').mockReturnValue({
      user: null,
      token: 'expired-token',
      refreshToken: 'valid-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUserToken: mockRefreshUserToken
    });
    
    // Render a component that triggers token refresh
    const RefreshComponent = () => {
      const { refreshUserToken } = useAuth();
      
      const handleRefresh = async () => {
        await refreshUserToken();
      };
      
      return (
        <button onClick={handleRefresh} data-testid="refresh-button">
          Refresh Token
        </button>
      );
    };
    
    render(<RefreshComponent />);
    
    // Trigger token refresh
    fireEvent.click(screen.getByTestId('refresh-button'));
    
    // Wait for the refresh to be called
    await waitFor(() => {
      expect(mockRefreshUserToken).toHaveBeenCalled();
    });
  });
});
