/**
 * Type definitions for AI API responses and requests
 */

// Context item from AI's reference database
export interface ContextItem {
  content: string;
  metadata: {
    source: string;
    session_id: string;
    [key: string]: any;
  };
}

// Response from the AI API for chat and edit interactions
export interface AIResponse {
  lab_json: any;
  response: string;
  mode: 'edit' | 'chat';
  session_id: string;
  actions?: string[];
  relevant_context?: ContextItem[];
}

// Response from processing reference text (e.g., from PDFs)
export interface ReferenceTextResponse {
  status: string;
  message: string;
  chunks_count?: number;
  total_chunks?: number;
  // Removed session_id since it's not returned by the backend
}

// Response from PDF to text conversion
export interface PDFToTextResponse {
  filename: string;
  text: string;
}

// Response from clearing a session
export interface ClearSessionResponse {
  status: string;
  message: string;
}

// Response from health check
export interface HealthCheckResponse {
  status: string;
}