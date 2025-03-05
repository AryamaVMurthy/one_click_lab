/// <reference types="jest" />

import { loginUser, refreshToken, getLabs } from '@/api/apiClient';
import { server } from '../mocks/server';
import { rest } from 'msw';
import { LoginResponse, RefreshTokenResponse, GetLabsResponse } from '@/types/api';

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) {
      return store[key] || null;
    },
    setItem: function(key: string, value: string) {
      store[key] = value;
    },
    removeItem: function(key: string) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock CustomEvent dispatch
Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn().mockImplementation(() => true)
});

describe('API Client', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should successfully login and return user data with tokens', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const result: LoginResponse = await loginUser(email, password);

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
    });

    it('should handle login errors', async () => {
      // Override the default handler for this specific test
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

      const email = 'wrong@example.com';
      const password = 'wrongpassword';

      const result: LoginResponse = await loginUser(email, password);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh the token', async () => {
      // Setup with a refresh token
      const oldRefreshToken = 'old-refresh-token';

      const result: RefreshTokenResponse = await refreshToken(oldRefreshToken);

      expect(result.success).toBe(true);
      expect(result.token).toBe('new-mock-access-token');
      expect(result.refreshToken).toBe('new-mock-refresh-token');
      expect(result.user).toBeDefined();
    });

    it('should handle refresh token errors', async () => {
      // Override the default handler for this specific test
      server.use(
        rest.post('http://localhost:8000/api/v1/refresh-token', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              success: false,
              error: 'Invalid refresh token'
            })
          );
        })
      );

      const invalidRefreshToken = 'invalid-refresh-token';

      const result: RefreshTokenResponse = await refreshToken(invalidRefreshToken);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
    });
  });

  describe('getLabs', () => {
    it('should fetch labs successfully', async () => {
      // Set access token
      const mockToken = 'mock-access-token';

      const result: GetLabsResponse = await getLabs(mockToken);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(Array.isArray(result.data.labs)).toBe(true);
        expect(result.data.labs.length).toBeGreaterThan(0);
        expect(result.data.pagination).toBeDefined();
      }
    });

    it('should handle unauthorized access', async () => {
      // Override the default handler for this specific test
      server.use(
        rest.get('http://localhost:8000/api/v1/labs', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              success: false,
              error: 'Unauthorized access'
            })
          );
        })
      );

      const invalidToken = 'invalid-token';
      const result: GetLabsResponse = await getLabs(invalidToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized access');
    });

    it('should handle pagination and filtering parameters', async () => {
      const mockToken = 'mock-access-token';
      const page = 2;
      const limit = 5;
      const status = 'published';
      const search = 'test lab';

      // Add a spy to check if URL is constructed properly
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      await getLabs(mockToken, page, limit, status, search);
      
      // Check if URL includes all parameters
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/page=2.*limit=5.*status=published.*search=test%20lab/),
        expect.anything()
      );
      
      fetchSpy.mockRestore();
    });
  });
});
