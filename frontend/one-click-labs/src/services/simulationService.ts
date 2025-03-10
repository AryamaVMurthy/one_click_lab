// Service for interacting with the simulation API

interface SimulationRequest {
  input: string;
  agent: 'json' | 'html' | 'both';
  json_state?: any;
  html_memory?: string | null;
  chat_memory?: Array<{role: string, content: string}>;
}

interface SimulationResponse {
  json?: any;
  html?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Generate a simulation based on the provided request
 */
export async function generateSimulation(request: SimulationRequest): Promise<SimulationResponse> {
  try {
    const response = await fetch(`${API_URL}/simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      // Include credentials if your API requires authentication
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating simulation:', error);
    throw error;
  }
}
