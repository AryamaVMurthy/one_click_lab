import { API_BASE_URL } from './apiClient';

// Store for token refresh promise to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<any> | null = null;

// Event names
const TOKEN_REFRESH_EVENT = 'token_refresh';
const TOKEN_REFRESH_ERROR_EVENT = 'token_refresh_error';

// Create event targets for refresh events
const tokenEvents = new EventTarget();

/**
 * Enhanced fetch utility for authenticated requests with token refresh
 */
export const fetchWithAuth = async (
  url: string,
  options: {
    method: string;
    token?: string;
    body?: string;
    headers?: Record<string, string>;
  }
): Promise<Response> => {
  const { token, ...fetchOptions } = options;
  
  // Prepare headers with authentication if token provided
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('Content-Type', 'application/json');
  
  // Make the initial request
  let response = await fetch(url, {
    ...fetchOptions,
    headers
  });
  
  // Check if token has expired (401 Unauthorized)
  if (response.status === 401 && token) {
    try {
      // Try to refresh the token
      const newToken = await refreshUserToken();
      
      if (newToken) {
        // Retry the request with the new token
        headers.set('Authorization', `Bearer ${newToken}`);
        
        response = await fetch(url, {
          ...fetchOptions,
          headers
        });
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
      // Dispatch token refresh error event
      dispatchTokenEvent(TOKEN_REFRESH_ERROR_EVENT);
    }
  }
  
  return response;
};

/**
 * Refresh user token - will only execute one refresh at a time
 * even if called from multiple places simultaneously
 */
const refreshUserToken = async (): Promise<string | null> => {
  // If a refresh is already in progress, return that promise
  if (refreshPromise) {
    try {
      return await refreshPromise;
    } catch (error) {
      return null;
    }
  }
  
  // Get refresh token from localStorage or cookies
  const refreshTokenValue = localStorage.getItem('refreshToken');
  
  if (!refreshTokenValue) {
    return null;
  }
  
  // Create a new refresh promise
  refreshPromise = new Promise(async (resolve, reject) => {
    try {
      // Make direct API call instead of using refreshTokenApi
      const response = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue })
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        // Update tokens in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Dispatch token refresh event
        dispatchTokenEvent(TOKEN_REFRESH_EVENT, {
          token: data.token,
          refreshToken: data.refreshToken,
          user: data.user
        });
        
        resolve(data.token);
      } else {
        // Refresh failed
        reject(new Error(data.error || 'Token refresh failed'));
      }
    } catch (error) {
      reject(error);
    } finally {
      // Clear the promise reference
      refreshPromise = null;
    }
  });
  
  try {
    return await refreshPromise;
  } catch (error) {
    return null;
  }
};

/**
 * Dispatch token events for subscribers
 */
const dispatchTokenEvent = (eventName: string, detail?: any) => {
  const event = new CustomEvent(eventName, { detail });
  tokenEvents.dispatchEvent(event);
};

/**
 * Subscribe to token refresh events
 */
export const onTokenRefresh = (
  callback: (event: CustomEvent) => void
) => {
  tokenEvents.addEventListener(TOKEN_REFRESH_EVENT, callback as EventListener);
  return () => {
    tokenEvents.removeEventListener(TOKEN_REFRESH_EVENT, callback as EventListener);
  };
};

/**
 * Subscribe to token refresh error events
 */
export const onTokenRefreshError = (
  callback: (event: CustomEvent) => void
) => {
  tokenEvents.addEventListener(TOKEN_REFRESH_ERROR_EVENT, callback as EventListener);
  return () => {
    tokenEvents.removeEventListener(TOKEN_REFRESH_ERROR_EVENT, callback as EventListener);
  };
};
