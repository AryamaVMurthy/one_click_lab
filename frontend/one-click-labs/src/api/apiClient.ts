/**
 * API Client for One Click Labs
 * Handles communication with the backend API
 */

import { 
  ApiResponse,
  LoginResponse,
  RefreshTokenResponse,
  AuthUser,
  GetUsersResponse,
  CreateLabRequest, 
  CreateLabResponse,
  GetLabResponse,
  UpdateLabRequest,
  UpdateLabResponse,
  DeployLabResponse,
  GetLabsResponse,
  SimulationResponse,
} from '../types/api';

// API Base URL - can be configured based on environment
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Import the fetchWithAuth utility
import { fetchWithAuth } from './fetchWithAuth';

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.detail || errorData.error || `Error: ${response.status} ${response.statusText}`
      };
    } catch (e) {
      return {
        success: false,
        error: `Error: ${response.status} ${response.statusText}`
      };
    }
  }

  try {
    const data = await response.json() as T;
    return {
      success: true,
      data
    };
  } catch (e) {
    return {
      success: false,
      error: 'Failed to parse response'
    };
  }
};

// Authentication API

/**
 * Register a new user
 */
export const registerUser = async (name: string, email: string, password: string): Promise<LoginResponse> => {
  // First register the user - this returns UserResponse, not LoginResponse
  const registerResponse = await fetchWithAuth(`${API_BASE_URL}/register`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

  const userResponse = await handleResponse<{ success: boolean; data: AuthUser; error?: string }>(registerResponse);
  
  if (!userResponse.success || !userResponse.data) {
    return {
      success: false,
      token: '',
      refreshToken: '',
      user: {} as AuthUser,
      error: userResponse.error || 'Registration failed'
    };
  }
  
  // Then login with the newly created credentials to get tokens
  // Use the email from the parameters since it's the same one we just registered with
  return loginUser(email, password);
};

/**
 * Login a user
 */
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/login`, {
    method: 'POST',
    body: JSON.stringify({ username: email, password }),
  });

  try {
    // Parse the raw response
    const jsonData = await response.json();
    
    // If the server directly returns a LoginResponse structure (not wrapped in ApiResponse)
    if (jsonData.token && jsonData.refreshToken && jsonData.user) {
      return jsonData as LoginResponse;
    }
    
    // If the server returns an ApiResponse wrapping a LoginResponse
    if (jsonData.success && jsonData.data && jsonData.data.token) {
      return {
        success: true,
        token: jsonData.data.token,
        refreshToken: jsonData.data.refreshToken,
        user: jsonData.data.user,
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      token: '',
      refreshToken: '',
      user: {} as AuthUser,
      error: jsonData.error || 'Login failed'
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      token: '',
      refreshToken: '',
      user: {} as AuthUser,
      error: 'Failed to parse login response'
    };
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/refresh-token`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  try {
    // Parse the raw response
    const jsonData = await response.json();
    
    // If the server directly returns a RefreshTokenResponse structure (not wrapped in ApiResponse)
    if (jsonData.token && jsonData.refreshToken && jsonData.user) {
      return jsonData as RefreshTokenResponse;
    }
    
    // If the server returns an ApiResponse wrapping a RefreshTokenResponse
    if (jsonData.success && jsonData.data && jsonData.data.token) {
      return {
        success: true,
        token: jsonData.data.token,
        refreshToken: jsonData.data.refreshToken,
        user: jsonData.data.user,
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      token: '',
      refreshToken: '',
      user: {} as AuthUser,
      error: jsonData.error || 'Token refresh failed'
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      token: '',
      refreshToken: '',
      user: {} as AuthUser,
      error: 'Failed to parse refresh token response'
    };
  }
};

/**
 * Logout a user
 */
export const logoutUser = async (token: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/logout`, {
    method: 'POST',
    token,
  });

  return handleResponse(response);
};

// Labs API

/**
 * Get all labs with pagination and filtering
 */
export const getLabs = async (token: string, page = 1, limit = 10, status = 'all', search?: string): Promise<GetLabsResponse> => {
  let url = `${API_BASE_URL}/labs?page=${page}&limit=${limit}&status=${status}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  const response = await fetchWithAuth(url, {
    method: 'GET',
    token,
  });

  try {
    const jsonData = await response.json();
    
    // If the server directly returns a GetLabsResponse structure
    if (jsonData.success !== undefined && jsonData.data) {
      return jsonData as GetLabsResponse;
    }
    
    // If the server returns the data directly (not wrapped in an ApiResponse)
    if (jsonData.labs) {
      return {
        success: true,
        data: jsonData,
        error: undefined
      };
    }
    
    // Return empty result with error message
    return {
      success: false,
      error: jsonData.error || 'Failed to fetch labs',
      data: {
        labs: [],
        pagination: {
          total: 0,
          page: page,
          limit: limit,
          pages: 0
        }
      }
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse labs response',
      data: {
        labs: [],
        pagination: {
          total: 0,
          page: page,
          limit: limit,
          pages: 0
        }
      }
    };
  }
};

/**
 * Get a lab by ID
 */
export const getLab = async (token: string, id: string): Promise<GetLabResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/labs/${id}`, {
    method: 'GET',
    token,
  });

  try {
    const jsonData = await response.json();
    
    // If the server directly returns a GetLabResponse structure
    if (jsonData.success !== undefined && (jsonData.data || jsonData.error)) {
      return jsonData as GetLabResponse;
    }
    
    // If the server returns the lab directly (not wrapped in ApiResponse)
    if (jsonData.id) {
      return {
        success: true,
        data: jsonData,
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      error: jsonData.error || `Failed to fetch lab with id ${id}`,
      data: undefined
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse lab response',
      data: undefined
    };
  }
};

/**
 * Create a new lab
 */
export const createLab = async (token: string, request: CreateLabRequest): Promise<CreateLabResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/labs`, {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });

  try {
    // Parse the raw response
    const jsonData = await response.json();
    
    // If the server directly returns a CreateLabResponse (not wrapped in ApiResponse)
    if (jsonData.success !== undefined && jsonData.data) {
      return jsonData as CreateLabResponse;
    }
    
    // In case the response doesn't match the expected structure
    return {
      success: false,
      error: jsonData.error || 'Failed to create lab',
      data: undefined
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse create lab response',
      data: undefined
    };
  }
};

/**
 * Update a lab
 */
export const updateLab = async (token: string, id: string, request: Partial<UpdateLabRequest['lab']>): Promise<UpdateLabResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/labs/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(request),
  });

  try {
    const jsonData = await response.json();
    
    // If the server directly returns an UpdateLabResponse structure
    if (jsonData.success !== undefined && (jsonData.data || jsonData.error)) {
      return jsonData as UpdateLabResponse;
    }
    
    // If the server returns the lab directly (not wrapped in ApiResponse)
    if (jsonData.id) {
      return {
        success: true,
        data: jsonData,
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      error: jsonData.error || `Failed to update lab with id ${id}`,
      data: undefined
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse update lab response',
      data: undefined
    };
  }
};

/**
 * Delete a lab
 */
export const deleteLab = async (token: string, id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/labs/${id}`, {
    method: 'DELETE',
    token,
  });

  try {
    const jsonData = await response.json();
    
    // If the response is already in the expected format
    if (jsonData.success !== undefined && (jsonData.data || jsonData.error)) {
      return jsonData as ApiResponse<{ message: string }>;
    }
    
    // If the server returns a message directly
    if (jsonData.message) {
      return {
        success: true,
        data: { message: jsonData.message },
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      error: jsonData.error || `Failed to delete lab with id ${id}`,
      data: undefined
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse delete lab response',
      data: undefined
    };
  }
};

/**
 * Deploy a lab
 */
export const deployLab = async (token: string, id: string): Promise<DeployLabResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/labs/${id}/deploy`, {
    method: 'POST',
    token,
  });

  try {
    const jsonData = await response.json();
    
    // If the server directly returns a DeployLabResponse structure
    if (jsonData.success !== undefined && (jsonData.data || jsonData.error)) {
      return jsonData as DeployLabResponse;
    }
    
    // If the server returns deployment details directly
    if (jsonData.deploymentUrl || jsonData.deployedVersion) {
      return {
        success: true,
        data: {
          deploymentUrl: jsonData.deploymentUrl,
          deployedVersion: jsonData.deployedVersion
        },
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      error: jsonData.error || `Failed to deploy lab with id ${id}`,
      data: undefined
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse deploy lab response',
      data: undefined
    };
  }
};

/**
 * Create a new section in a lab
 */
export const createSection = async (token: string, labId: string, sectionData: any): Promise<ApiResponse<any>> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/labs/${labId}/sections`, {
    method: 'POST',
    token,
    body: JSON.stringify(sectionData),
  });

  const apiResponse = await handleResponse<ApiResponse<any>>(response);
  
  if (!apiResponse.success) {
    return {
      success: false,
      error: apiResponse.error || 'Failed to create section',
      data: undefined
    };
  }
  
  return apiResponse;
};

/**
 * Update lab content including sections and modules
 */
export const updateLabContent = async (token: string, labId: string, contentData: any): Promise<ApiResponse<any>> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/labs/${labId}/update-content`, {
    method: 'POST',
    token,
    body: JSON.stringify(contentData),
  });

  const apiResponse = await handleResponse<ApiResponse<any>>(response);
  
  if (!apiResponse.success) {
    return {
      success: false,
      error: apiResponse.error || `Failed to update content for lab with id ${labId}`,
      data: undefined
    };
  }
  
  return apiResponse;
};

/**
 * Create a new module in a section
 */
export const createModule = async (token: string, sectionId: string, moduleData: any): Promise<ApiResponse<any>> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/sections/${sectionId}/modules`, {
    method: 'POST',
    token,
    body: JSON.stringify(moduleData),
  });

  const apiResponse = await handleResponse<ApiResponse<any>>(response);
  
  if (!apiResponse.success) {
    return {
      success: false,
      error: apiResponse.error || 'Failed to create module',
      data: undefined
    };
  }
  
  return apiResponse;
};

/**
 * Get user labs
 */
export const getUserLabs = async (token: string): Promise<GetLabsResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/user/labs`, {
    method: 'GET',
    token,
  });

  try {
    const jsonData = await response.json();
    
    // If the server directly returns a GetLabsResponse structure
    if (jsonData.success !== undefined && jsonData.data) {
      return jsonData as GetLabsResponse;
    }
    
    // If the server returns the data directly (not wrapped in an ApiResponse)
    if (jsonData.labs) {
      return {
        success: true,
        data: jsonData,
        error: undefined
      };
    }
    
    // Return empty result with error message
    return {
      success: false,
      error: jsonData.error || 'Failed to fetch user labs',
      data: {
        labs: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0
        }
      }
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse user labs response',
      data: {
        labs: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0
        }
      }
    };
  }
};

/**
 * Share a lab with another user
 */
export const shareLabWithUser = async (token: string, labId: string, userId: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/labs/${labId}/share`, {
    method: 'POST',
    token,
    body: JSON.stringify({ userId }),
  });

  try {
    const jsonData = await response.json();
    
    // If the response is already in the expected format
    if (jsonData.success !== undefined && (jsonData.data || jsonData.error)) {
      return jsonData as ApiResponse<{ message: string }>;
    }
    
    // If the server returns a message directly
    if (jsonData.message) {
      return {
        success: true,
        data: { message: jsonData.message },
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      error: jsonData.error || `Failed to share lab with user`,
      data: undefined
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse share lab response',
      data: undefined
    };
  }
};

/**
 * Get all users (for admins)
 */
export const getUsers = async (token: string): Promise<GetUsersResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/users`, {
    method: 'GET',
    token,
  });

  try {
    const jsonData = await response.json();
    
    // If the server directly returns a GetUsersResponse structure
    if (jsonData.success !== undefined && jsonData.data) {
      return jsonData as GetUsersResponse;
    }
    
    // If the server returns the data directly (not wrapped in an ApiResponse)
    if (Array.isArray(jsonData)) {
      return {
        success: true,
        data: { users: jsonData },
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      error: jsonData.error || 'Failed to fetch users',
      data: { users: [] }
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse users response',
      data: { users: [] }
    };
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (token: string): Promise<ApiResponse<AuthUser>> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/user/profile`, {
    method: 'GET',
    token,
  });

  try {
    const jsonData = await response.json();
    
    // If the response is already in the expected format
    if (jsonData.success !== undefined && (jsonData.data || jsonData.error)) {
      return jsonData as ApiResponse<AuthUser>;
    }
    
    // If the server returns the user directly
    if (jsonData.email && jsonData.username) {
      return {
        success: true,
        data: jsonData as AuthUser,
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      error: jsonData.error || 'Failed to fetch user profile',
      data: undefined
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse user profile response',
      data: undefined
    };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (token: string, data: Partial<AuthUser>): Promise<ApiResponse<AuthUser>> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/user/profile`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });

  try {
    const jsonData = await response.json();
    
    // If the response is already in the expected format
    if (jsonData.success !== undefined && (jsonData.data || jsonData.error)) {
      return jsonData as ApiResponse<AuthUser>;
    }
    
    // If the server returns the user directly
    if (jsonData.email && jsonData.username) {
      return {
        success: true,
        data: jsonData as AuthUser,
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      error: jsonData.error || 'Failed to update user profile',
      data: undefined
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse update profile response',
      data: undefined
    };
  }
};

/**
 * Change password
 */
export const changePassword = async (token: string, data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/user/change-password`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });

  try {
    const jsonData = await response.json();
    
    // If the response is already in the expected format
    if (jsonData.success !== undefined && (jsonData.data || jsonData.error)) {
      return jsonData as ApiResponse<{ message: string }>;
    }
    
    // If the server returns a message directly
    if (jsonData.message) {
      return {
        success: true,
        data: { message: jsonData.message },
        error: undefined
      };
    }
    
    // Handle error case
    return {
      success: false,
      error: jsonData.error || 'Failed to change password',
      data: undefined
    };
  } catch (error) {
    // Handle parsing error
    return {
      success: false,
      error: 'Failed to parse change password response',
      data: undefined
    };
  }
};

// Simulation API

export const processSimulationResponse = (response: SimulationResponse) => {
  return {
    json: response.json,
    html: response.html
  };
};

/**
 * Generate simulation content using AI
 */
export const generateSimulation = async (
  input: string,
  agent: 'json' | 'html' | 'both',
  jsonState?: any,
  htmlMemory?: string,
  chatMemory: Array<{role: string, content: string}> = []
) => {
  try {
    console.log("Sending API request with:", { 
      input, 
      agent, 
      jsonState: jsonState ? "Present" : "Not present",
      htmlMemory: htmlMemory ? "Present" : "Not present"
    });

    const response = await fetch(`${API_BASE_URL}/simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        agent,
        json_state: jsonState,
        html_memory: htmlMemory,
        chat_memory: chatMemory
      }),
    });

    if (!response.ok) {
      console.error("API error:", response.status, response.statusText);
      return {
        success: false,
        error: `Server error: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    console.log("API response received:", {
      hasJson: !!data.json,
      hasHtml: !!data.html,
      htmlLength: data.html ? data.html.length : 0
    });

    return {
      success: true,
      data: {
        json: data.json || null,
        html: data.html || null
      },
      error: undefined
    };
  } catch (error) {
    console.error("Exception in API call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Add a global event listener for token refresh
if (typeof window !== 'undefined') {
  window.addEventListener('token:refresh', async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedRefreshToken) {
      try {
        const response = await refreshToken(storedRefreshToken);
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          return true;
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }
    return false;
  });
}