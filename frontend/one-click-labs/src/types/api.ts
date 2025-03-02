import { Lab, ID } from './models';

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Lab API interfaces
export interface GetLabResponse extends ApiResponse<Lab> {}

export interface CreateLabRequest {
  title: string;
  description?: string;
}

export interface CreateLabResponse extends ApiResponse<Lab> {}

export interface UpdateLabRequest {
  id: ID;
  lab: Partial<Lab>;
}

export interface UpdateLabResponse extends ApiResponse<Lab> {}

export interface DeployLabResponse extends ApiResponse<{
  deploymentUrl: string;
  deployedVersion: string;
}> {}

export interface LabListItem {
  id: ID;
  title: string;
  description: string;
  updatedAt: string;
  isPublished: boolean;
}

export interface GetLabsResponse extends ApiResponse<LabListItem[]> {}

// Error states
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
