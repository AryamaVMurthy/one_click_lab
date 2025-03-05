import '@testing-library/jest-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('*', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
);

// Establish API mocking before all tests
beforeAll(() => server.listen({ 
  onUnhandledRequest: 'warn' 
}));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers();
  
  // Clear mocks after each test
  jest.clearAllMocks();
  
  // Reset localStorage
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
});

// Clean up after the tests are finished
afterAll(() => server.close());
