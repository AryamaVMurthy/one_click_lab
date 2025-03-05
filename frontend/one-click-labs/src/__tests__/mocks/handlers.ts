import { rest } from 'msw';

// Mock user data for testing
export const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'creator',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

// Mock token response
export const mockTokens = {
  token: 'mock-access-token',
  refreshToken: 'mock-refresh-token'
};

// Define LabStatus enum
export enum LabStatus {
  DRAFT,
  PUBLISHED
}

// Mock lab data for testing
export const mockLab = {
  id: 'test-lab-id',
  title: 'Test Lab',
  description: 'This is a test lab',
  status: LabStatus.DRAFT,
  isPublished: false,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  userId: mockUser.id,
  author: {
    id: mockUser.id,
    name: mockUser.name,
    email: mockUser.email
  },
  sections: []
};

// API base URL
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Define handlers
export const handlers = [
  // Authentication handlers
  rest.post(`${API_BASE_URL}/register`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        token: mockTokens.token,
        refreshToken: mockTokens.refreshToken,
        user: mockUser,
        error: null
      })
    );
  }),

  rest.post(`${API_BASE_URL}/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        token: mockTokens.token,
        refreshToken: mockTokens.refreshToken,
        user: mockUser,
        error: null
      })
    );
  }),

  rest.post(`${API_BASE_URL}/refresh-token`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        token: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
        user: mockUser,
        error: null
      })
    );
  }),

  rest.post(`${API_BASE_URL}/logout`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: { message: 'Logged out successfully' },
        error: null
      })
    );
  }),

  // Lab API handlers
  rest.get(`${API_BASE_URL}/labs`, (req, res, ctx) => {
    const url = new URL(req.url.toString());
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || 'all';
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          labs: [mockLab],
          pagination: {
            total: 1,
            page,
            limit,
            pages: 1
          }
        },
        error: null
      })
    );
  }),

  rest.get(`${API_BASE_URL}/labs/:id`, (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: { ...mockLab, id },
        error: null
      })
    );
  }),

  rest.post(`${API_BASE_URL}/labs`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockLab,
        error: null
      })
    );
  }),

  rest.put(`${API_BASE_URL}/labs/:id`, (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: { ...mockLab, id },
        error: null
      })
    );
  }),

  rest.delete(`${API_BASE_URL}/labs/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: { message: 'Lab deleted successfully' },
        error: null
      })
    );
  }),

  rest.post(`${API_BASE_URL}/labs/:id/deploy`, (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          ...mockLab,
          id,
          status: LabStatus.PUBLISHED,
          isPublished: true,
          publishedAt: new Date().toISOString(),
          deploymentUrls: {
            preview: 'https://example.com/preview/lab-id',
            live: 'https://example.com/lab-id'
          }
        },
        error: null
      })
    );
  })
];
