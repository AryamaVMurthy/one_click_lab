/**
 * AI API Client for One Click Labs
 * Handles communication with the AI text generation backend API
 */

import { Lab } from '@/types/models';
import { 
  AIResponse, 
  ReferenceTextResponse, 
  PDFToTextResponse,
  ClearSessionResponse,
  HealthCheckResponse
} from '@/types/aiTypes';

// API Base URL for the AI backend - running on port 8001
const AI_API_BASE_URL = 'http://localhost:8001';

/**
 * Process an edit command
 */
export const processEditCommand = async (
  labJson: Lab, 
  prompt: string, 
  sessionId?: string
): Promise<AIResponse> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/revisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lab_json: labJson,
        prompt: prompt,
        session_id: sessionId,
        mode: 'edit'
      })
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing edit command:', error);
    throw error;
  }
};

/**
 * Process a chat message
 */
export const processChatMessage = async (
  labJson: Lab, 
  message: string, 
  sessionId?: string
): Promise<AIResponse> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lab_json: labJson,
        message: message,
        session_id: sessionId,
        mode: 'chat'
      })
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing chat message:', error);
    throw error;
  }
};

/**
 * Toggle between chat and edit modes
 */
export const toggleMode = async (
  labJson: Lab, 
  mode: 'edit' | 'chat', 
  sessionId?: string
): Promise<AIResponse> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/toggle_mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lab_json: labJson,
        session_id: sessionId,
        mode: mode
      })
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling mode:', error);
    throw error;
  }
};

/**
 * Process user prompt and determine appropriate mode
 */
export const handleUserPrompt = async (
  labJson: Lab, 
  prompt: string, 
  currentMode: 'edit' | 'chat',
  sessionId?: string
): Promise<AIResponse> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/handle_user_prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lab_json: labJson,
        prompt: prompt,
        session_id: sessionId,
        current_mode: currentMode
      })
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error handling user prompt:', error);
    throw error;
  }
};

/**
 * Convert PDF to text
 */
export const pdfToText = async (file: File): Promise<PDFToTextResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${AI_API_BASE_URL}/api/pdf_to_text`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error converting PDF to text:', error);
    throw error;
  }
};

/**
 * Process reference text for context
 */
export const processReferenceText = async (
  text: string, 
  sessionId?: string
): Promise<ReferenceTextResponse> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/process_reference_text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        session_id: sessionId
      })
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing reference text:', error);
    throw error;
  }
};

/**
 * Clear session memory
 */
export const clearSession = async (sessionId: string): Promise<ClearSessionResponse> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/sessions/${sessionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
};

/**
 * Check API health
 */
export const checkApiHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/health`);

    if (!response.ok) {
      return { status: 'unhealthy' };
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking API health:', error);
    return { status: 'unhealthy' };
  }
};