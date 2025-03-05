/// <reference types="jest" />
/// <reference types="../types/jest-dom.d.ts" />

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { useRouter } from 'next/navigation';
import { server } from '../mocks/server';
import { rest } from 'msw';
import { useAuth } from '@/context/AuthContext';
import { mockUser, mockLab } from '../mocks/handlers';
import * as apiClientModule from '@/api/apiClient';

// Mock necessary components for testing
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams())
}));

// Sample lab list component for testing
const LabListComponent = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [labs, setLabs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const fetchLabs = async () => {
    try {
      setLoading(true);
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token') || '';
      const response = await apiClientModule.getLabs(token);
      
      if (response.success) {
        if (response.data) {
          setLabs(response.data.labs);
          setError('');
        } else {
          throw new Error("Response data is undefined");
        }
      } else {
        setError(response.error || 'Failed to fetch labs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch labs');
    } finally {
      setLoading(false);
    }
  };

  const createNewLab = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token') || '';
      const response = await apiClientModule.createLab(token, {
        title: 'New Lab',
        description: 'This is a new lab'
      });
      
      if (response.success) {
        if (response.data) {
          // Add the new lab to the list
          setLabs(prevLabs => [...prevLabs, response.data]);
          setError('');
        } else {
          throw new Error("Response data is undefined");
        }
      } else {
        setError(response.error || 'Failed to create lab');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create lab');
    } finally {
      setLoading(false);
    }
  };

  const deleteLab = async (id: string) => {
    try {
      setLoading(true);
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token') || '';
      const response = await apiClientModule.deleteLab(token, id);
      
      if (response.success) {
        // Remove the deleted lab from the list
        setLabs(prevLabs => prevLabs.filter(lab => lab.id !== id));
        setError('');
      } else {
        setError(response.error || 'Failed to delete lab');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete lab');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchLabs();
    }
  }, [user]);

  if (!user) {
    return <div>Please login to view labs</div>;
  }

  return (
    <div>
      <h1>Your Labs</h1>
      {error && <div data-testid="error-message">{error}</div>}
      
      <button onClick={createNewLab} data-testid="create-lab-button">
        Create New Lab
      </button>

      {loading ? (
        <div data-testid="loading">Loading...</div>
      ) : (
        <ul data-testid="lab-list">
          {labs.map(lab => (
            <li key={lab.id} data-testid={`lab-item-${lab.id}`}>
              <h3>{lab.title}</h3>
              <p>{lab.description}</p>
              <button 
                onClick={() => router.push(`/labs/${lab.id}`)}
                data-testid={`view-lab-${lab.id}`}
              >
                View
              </button>
              <button 
                onClick={() => deleteLab(lab.id)}
                data-testid={`delete-lab-${lab.id}`}
              >
                Delete
              </button>
            </li>
          ))}
          {labs.length === 0 && <div data-testid="no-labs">No labs found</div>}
        </ul>
      )}
    </div>
  );
};

describe('Lab Management Flow', () => {
  const mockPush = jest.fn();
  const mockGetLabs = jest.spyOn(apiClientModule, 'getLabs');
  const mockCreateLab = jest.spyOn(apiClientModule, 'createLab');
  const mockDeleteLab = jest.spyOn(apiClientModule, 'deleteLab');

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn()
    });
    
    // Setup default mock implementation
    mockGetLabs.mockResolvedValue({
      success: true,
      data: {
        labs: [mockLab as any],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1
        }
      },
      error: undefined
    });
    
    mockCreateLab.mockResolvedValue({
      success: true,
      data: {
        ...mockLab,
        id: 'new-lab-id',
        title: 'New Lab',
        description: 'This is a new lab',
        userId: mockLab.userId
      } as unknown as import('@/types/models').Lab,
      error: undefined
    });
    
    mockDeleteLab.mockResolvedValue({
      success: true,
      data: { message: 'Lab deleted successfully' },
      error: undefined
    });

    // Mock authentication context
    jest.spyOn(require('@/context/AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUserToken: jest.fn().mockResolvedValue(true)
    });
    
    // Set token in localStorage for API calls
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should fetch and display labs on initial load', async () => {
    render(<LabListComponent />);

    // Check if loading state is shown
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for labs to load
    await waitFor(() => {
      expect(screen.getByTestId('lab-list')).toBeInTheDocument();
    });

    // Verify API was called with token
    expect(mockGetLabs).toHaveBeenCalledWith('mock-token');

    // Verify lab is displayed
    expect(screen.getByTestId(`lab-item-${mockLab.id}`)).toBeInTheDocument();
    expect(screen.getByText(mockLab.title)).toBeInTheDocument();
  });

  it('should handle lab creation', async () => {
    render(<LabListComponent />);

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('lab-list')).toBeInTheDocument();
    });

    // Click create lab button
    fireEvent.click(screen.getByTestId('create-lab-button'));

    // Should show loading state again
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for creation to complete
    await waitFor(() => {
      expect(screen.getByTestId('lab-list')).toBeInTheDocument();
    });

    // Verify API was called with correct parameters
    expect(mockCreateLab).toHaveBeenCalledWith('mock-token', {
      title: 'New Lab',
      description: 'This is a new lab'
    });
    
    // Verify new lab is added to the list
    expect(screen.getByText('New Lab')).toBeInTheDocument();
  });

  it('should handle lab deletion', async () => {
    render(<LabListComponent />);

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('lab-list')).toBeInTheDocument();
    });

    // Click delete lab button
    fireEvent.click(screen.getByTestId(`delete-lab-${mockLab.id}`));

    // Should show loading state again
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for deletion to complete
    await waitFor(() => {
      expect(screen.getByTestId('lab-list')).toBeInTheDocument();
    });

    // Verify API was called with correct parameters
    expect(mockDeleteLab).toHaveBeenCalledWith('mock-token', mockLab.id);
    
    // Verify lab is removed from the list
    expect(screen.getByTestId('no-labs')).toBeInTheDocument();
  });

  it('should handle api errors', async () => {
    // Mock error response
    mockGetLabs.mockResolvedValueOnce({
      success: false,
      data: undefined,
      error: 'Failed to fetch labs'
    });

    render(<LabListComponent />);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to fetch labs');
    });
  });

  it('should navigate to lab details when view button is clicked', async () => {
    render(<LabListComponent />);

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('lab-list')).toBeInTheDocument();
    });

    // Click view lab button
    fireEvent.click(screen.getByTestId(`view-lab-${mockLab.id}`));

    // Verify navigation
    expect(mockPush).toHaveBeenCalledWith(`/labs/${mockLab.id}`);
  });
});
