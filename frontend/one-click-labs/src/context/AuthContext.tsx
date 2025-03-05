"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, registerUser, refreshToken as refreshTokenApi, logoutUser } from '@/api/apiClient';
import { User } from '@/types/models';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { onTokenRefresh, onTokenRefreshError } from '@/api/fetchWithAuth';

// Cookie options
const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  expires: 7 // days
};

// Define the auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Define the auth context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUserToken: () => Promise<boolean>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial auth state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const router = useRouter();

  // Initialize auth state from localStorage and cookies on component mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Get auth data from both localStorage and cookies for fallback
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token') || Cookies.get('token');
        const storedRefreshToken = localStorage.getItem('refreshToken') || Cookies.get('refreshToken');

        if (storedUser && storedToken && storedRefreshToken) {
          // Parse the stored user data
          const user = JSON.parse(storedUser);
          
          // Update auth state
          setAuthState({
            user,
            token: storedToken,
            refreshToken: storedRefreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // No stored auth data
          setAuthState({
            ...initialState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        // Clear any invalid data
        clearAuthData();
        
        setAuthState({
          ...initialState,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // Set up listeners for token refresh events
  useEffect(() => {
    // Handler for successful token refresh
    const handleTokenRefresh = (event: CustomEvent) => {
      const { token, refreshToken, user } = event.detail;
      
      if (token && refreshToken && user) {
        // Update auth state with new tokens
        setAuthState({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Update stored data
        setAuthData(user, token, refreshToken);
      }
    };
    
    // Handler for token refresh errors
    const handleTokenRefreshError = () => {
      // If token refresh fails completely, log the user out
      logout();
    };
    
    // Register event listeners
    const unsubscribeRefresh = onTokenRefresh(handleTokenRefresh as (event: CustomEvent) => void);
    const unsubscribeError = onTokenRefreshError(handleTokenRefreshError as (event: CustomEvent) => void);
    
    // Clean up listeners on unmount
    return () => {
      unsubscribeRefresh();
      unsubscribeError();
    };
  }, []);  // Empty dependency array - only run once on mount

  // Helper to clear auth data from both localStorage and cookies
  const clearAuthData = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    Cookies.remove('token');
    Cookies.remove('refreshToken');
  };

  // Set auth data in both localStorage and cookies
  const setAuthData = (user: User, token: string, refreshTokenValue: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshTokenValue);
    Cookies.set('token', token, COOKIE_OPTIONS);
    Cookies.set('refreshToken', refreshTokenValue, COOKIE_OPTIONS);
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await loginUser(email, password);

      if (response.success && response.token && response.user) {
        // Store auth data
        setAuthData(response.user, response.token, response.refreshToken);

        // Update auth state
        setAuthState({
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setAuthState({ ...authState, isLoading: true });

    try {
      const response = await registerUser(name, email, password);

      if (response.success) {
        // Registration and auto-login were successful
        // The registerUser function already handles login internally
        // Store auth data from the response
        setAuthData(response.user, response.token, response.refreshToken);
        
        // Update auth state
        setAuthState({
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Redirect to the dashboard
        router.push('/');
        return { success: true };
      } else {
        // Registration failed
        setAuthState({
          ...initialState,
          isLoading: false,
        });

        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      setAuthState({
        ...initialState,
        isLoading: false,
      });

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  };

  // Refresh token function
  const refreshUserToken = async (): Promise<boolean> => {
    if (!authState.refreshToken) return false;
    
    try {
      const response = await refreshTokenApi(authState.refreshToken);
      
      if (response.success && response.token && response.refreshToken && response.user) {
        // Update stored tokens
        setAuthData(response.user, response.token, response.refreshToken);
        
        // Update auth state
        setAuthState({
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
        
        return true;
      }
      
      // If refresh failed, log out
      await logout();
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (authState.token) {
        await logoutUser(authState.token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth data
      clearAuthData();

      // Reset auth state
      setAuthState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // Redirect to login
      router.push('/login');
    }
  };

  // Provide the auth context
  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        refreshUserToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
