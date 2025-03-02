# Frontend-Backend Integration Specification

This document outlines how to integrate the One Click Labs frontend with the FastAPI backend. It includes details on current mock API implementation and steps to replace them with real API calls.

## Table of Contents

1. [Current Mock Implementation](#current-mock-implementation)
2. [Integration Approach](#integration-approach)
3. [API Client Implementation](#api-client-implementation)
4. [Authentication Integration](#authentication-integration)
5. [Error Handling](#error-handling)
6. [Implementation Steps](#implementation-steps)
7. [Initial Data Loading Strategy](#initial-data-loading-strategy)

---

## Current Mock Implementation

The frontend currently uses mock implementations from `src/api/mockApi.ts`. These mock functions simulate API behavior and store data in memory.

### Current Mock Functions

| Mock Function | Purpose | Mock Data Storage |
| --- | --- | --- |
| `mockGetLab(id)` | Retrieves a lab by ID | Stored in `mockLabs` object using lab ID as key |
| `mockUpdateLab({id, lab})` | Updates an existing lab | Updates lab in `mockLabs` object |
| `mockCreateLab(labData)` | Creates a new lab | Adds lab to `mockLabs` with generated ID |
| `mockGetLabs(page, limit, status, search)` | Lists labs with pagination and filtering | Filters and paginates from `mockLabs` |
| `mockDeleteLab(id)` | Deletes a lab | Removes lab from `mockLabs` object |
| `mockDeployLab(id)` | Simulates deployment process | Updates lab with deployment info in `mockLabs` |

### Current Mock Data Structure

```typescript
// In-memory storage
const mockLabs: Record<string, Lab> = {
  'lab-1': { /* lab data */ },
  'lab-2': { /* lab data */ },
  // Additional labs...
};
```

### Example Mock Function Implementation

```typescript
// Example of mockGetLab implementation
export const mockGetLab = async (id: string): Promise<ApiResponse<Lab>> => {
  // Simulate network delay
  await delay(500);
  
  if (mockLabs[id]) {
    return {
      success: true,
      data: mockLabs[id]
    };
  }
  
  return {
    success: false,
    error: 'Lab not found'
  };
};
```

---

## Integration Approach

Replace the mock API implementation with real API calls to the FastAPI backend, while maintaining the same interface to minimize changes in components.

### API Response Structure

The backend API and current mock implementation both use the same response structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

This consistent structure allows for minimal changes in the frontend components.

---

## API Client Implementation

### New API Client Structure

1. Create a new API client module (`src/api/apiClient.ts`) that will replace the mock implementations.
2. Use Axios or Fetch API for HTTP requests.
3. Implement the same function signatures as the mock API.

### Example Implementation

```typescript
// Base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Get auth token from storage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// HTTP client with auth headers
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
client.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions with the same signatures as mock functions
export const getLab = async (id: string): Promise<ApiResponse<Lab>> => {
  try {
    const response = await client.get(`/labs/${id}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to load lab'
    };
  }
};

// Additional functions...
```

---

## Authentication Integration

### Current State

The mock implementation does not handle authentication. The real implementation will need to:

1. Manage token storage and retrieval
2. Handle login/logout flows
3. Protect routes that require authentication
4. Refresh expired tokens

### Auth Context Implementation

```typescript
// Create AuthContext.tsx for managing auth state
import { createContext, useState, useEffect, useContext } from 'react';
import { login, logout, refreshToken } from './api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on load
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        // Check if token needs refresh
        const tokenExp = localStorage.getItem('token_expiry');
        if (tokenExp && Date.now() > parseInt(tokenExp, 10)) {
          await refreshUserToken();
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  // Auth methods
  const loginUser = async (email, password) => {
    // Implementation
  };
  
  const logoutUser = async () => {
    // Implementation
  };
  
  const refreshUserToken = async () => {
    // Implementation
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login: loginUser, 
      logout: logoutUser, 
      isAuthenticated: !!user,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## Error Handling

### Consistent Error Pattern

1. Each API function should catch and format errors consistently
2. Use HTTP status codes from backend to determine error types
3. Implement retry logic for network errors
4. Detect authentication errors (401) and trigger token refresh or logout

### Error Handling Example

```typescript
export const updateLab = async ({ id, lab }: { id: string; lab: Partial<Lab> }): Promise<ApiResponse<Lab>> => {
  try {
    const response = await client.put(`/labs/${id}`, lab);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    // Handle specific error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        // Unauthorized - token expired
        const refreshed = await refreshUserToken();
        if (refreshed) {
          // Retry request
          return updateLab({ id, lab });
        } else {
          // Logout user if refresh failed
          logout();
          return {
            success: false,
            error: 'Session expired. Please log in again.'
          };
        }
      }
      
      return {
        success: false,
        error: error.response.data.detail || `Error: ${error.response.status}`
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    } else {
      // Something happened in setting up the request
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  }
};
```

---

## Implementation Steps

### 1. Environment Configuration

Set up environment variables for API URLs:

### 2. Replace Mock API Functions with Real API Calls

1. Create new API client module with real API calls
2. Identify and list all places where mock API functions are imported
3. Update imports to use the new API client module
4. Test each function to ensure it works as expected

### 3. Update API Function Mapping

| Mock Function | Real API Function | Endpoint |
| --- | --- | --- |
| `mockGetLab` | `getLab` | GET `/api/v1/labs/{id}` |
| `mockUpdateLab` | `updateLab` | PUT `/api/v1/labs/{id}` |
| `mockCreateLab` | `createLab` | POST `/api/v1/labs` |
| `mockGetLabs` | `getLabs` | GET `/api/v1/labs?page={page}&limit={limit}&status={status}&search={search}` |
| `mockDeleteLab` | `deleteLab` | DELETE `/api/v1/labs/{id}` |
| `mockDeployLab` | `deployLab` | POST `/api/v1/labs/{id}/deploy` |
| N/A | `generateTextContent` | POST `/api/v1/ai/generate-text` |
| N/A | `generateQuiz` | POST `/api/v1/ai/generate-quiz` |
| N/A | `autocomplete` | POST `/api/v1/ai/autocomplete` |

### 4. Authentication Integration

1. Add login/register pages
2. Create AuthContext and AuthProvider
3. Implement token storage and management
4. Add protected route wrapper

### 5. Testing

1. Test each API call independently
2. Test authentication flow
3. Test error handling scenarios
4. Verify that all components still function correctly with real API calls

### 6. Progressive Replacement Strategy

To minimize risk, replace mock API functions one at a time:

1. Start with read-only functions like `getLab` and `getLabs`
2. Move to mutation functions like `createLab` and `updateLab`
3. Finally, replace complex operations like `deployLab`
4. Add newly required functions like AI-related endpoints

---

## Initial Data Loading Strategy

When the frontend application loads, it needs to fetch initial data from the backend. This section outlines the strategy for ensuring the application always has the most up-to-date data from MongoDB.

### Dashboard Initial Loading

1. **Labs List Page Loading**:
   - When the dashboard loads, immediately call `getLabs()` with default pagination (page 1, limit 10)
   - Show a loading state while data is being fetched
   - Once data arrives, render the labs list
   - Implement error handling for failed requests

```typescript
// Example implementation in dashboard page
const [labs, setLabs] = useState<Lab[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const response = await getLabs(1, 10, 'all');
      if (response.success && response.data) {
        setLabs(response.data.labs);
      } else {
        setError(response.error || 'Failed to load labs');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  fetchInitialData();
}, []);
```

### Lab Editor Initial Loading

1. **Edit Lab Page Loading**:
   - Use the URL parameter to identify which lab to load
   - Call `getLab(id)` immediately when the component mounts
   - Show a loading state until data is available
   - Gracefully handle any loading errors

2. **Data Freshness**:
   - Implement conditional refetching if data might be stale
   - Use timestamp comparison to determine staleness
   - Consider adding a refresh button for manual data reload

### Caching Considerations

1. **Client-side Caching Strategy**:
   - Determine which data is appropriate to cache (labs list, individual labs)
   - Set appropriate cache expiration times based on data update frequency
   - Implement a simple cache layer in the API client:

```typescript
// Simple cache implementation for API results
const cache: Record<string, {data: any, timestamp: number}> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getLabs = async (
  page: number = 1, 
  limit: number = 10, 
  status: string = 'all', 
  search?: string, 
  skipCache: boolean = false
): Promise<ApiResponse<LabsResponse>> => {
  const cacheKey = `labs_${page}_${limit}_${status}_${search || ''}`;
  
  // Check cache if not explicitly skipping cache
  if (!skipCache && cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
    return {
      success: true,
      data: cache[cacheKey].data
    };
  }
  
  try {
    // Make real API call
    const response = await client.get('/labs', {
      params: { page, limit, status, search }
    });
    
    // Update cache
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    // Error handling
    // ...
  }
};
```

2. **Cache Invalidation Triggers**:
   - After successful create/update/delete operations, invalidate relevant cache entries
   - Allow forced refresh by providing a skipCache option in API functions
   - Implement a global cache clear functionality for the API client

### Server-Side Fetching

For pages that use server-side rendering (SSR) or static site generation (SSG):

1. Use appropriate Next.js data fetching methods:
   - `getServerSideProps` for dynamic content that needs fresh data on each request
   - `getStaticProps` with appropriate revalidation for more static content

2. Make direct backend API calls during server-side rendering to fetch initial data:
```typescript
export async function getServerSideProps(context) {
  try {
    // Use a server-side API client configured with appropriate base URL
    const serverApiClient = createServerApiClient();
    const response = await serverApiClient.get(`/api/v1/labs/${context.params.id}`);
    
    return {
      props: {
        initialLabData: response.data,
        error: null
      }
    };
  } catch (error) {
    console.error('Error fetching lab:', error);
    return {
      props: {
        initialLabData: null,
        error: 'Failed to load lab'
      }
    };
  }
}
```

### Optimistic Updates

1. **Immediate UI Updates**:
   - When creating, updating, or deleting items, update the UI immediately before API call completes
   - Keep the previous state to revert if the API call fails
   - Show appropriate loading states during operations

2. **Example for Lab Updates**:
```typescript
const updateLabSection = async (sectionId, updatedData) => {
  // Store previous state in case we need to revert
  const previousSections = [...lab.sections];
  
  // Optimistically update the UI
  setLab(prevLab => ({
    ...prevLab,
    sections: prevLab.sections.map(section => 
      section.id === sectionId ? {...section, ...updatedData} : section
    )
  }));
  
  // Make the API call
  try {
    const response = await updateLab({
      id: lab.id,
      lab: {
        sections: lab.sections.map(section => 
          section.id === sectionId ? {...section, ...updatedData} : section
        )
      }
    });
    
    if (!response.success) {
      // Revert to previous state if the API call failed
      setLab(prevLab => ({...prevLab, sections: previousSections}));
      showErrorToast(response.error || 'Failed to update section');
    }
  } catch (error) {
    // Revert to previous state if an error occurred
    setLab(prevLab => ({...prevLab, sections: previousSections}));
    showErrorToast('An unexpected error occurred');
  }
};
```

### Data Synchronization

1. **WebSocket Integration** (optional future enhancement):
   - For collaborative editing, consider integrating WebSockets
   - Use WebSockets to receive real-time updates when multiple users edit the same lab
   - Implement a synchronization protocol to merge remote changes with local state

By implementing these strategies, the application will ensure that users always see the most current data from MongoDB when they load the application, while balancing performance through appropriate caching mechanisms.