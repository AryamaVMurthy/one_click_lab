import { 
  CreateLabRequest, 
  CreateLabResponse,
  GetLabResponse,
  UpdateLabRequest,
  UpdateLabResponse,
  DeployLabResponse
} from '../types/api';
import { 
  Lab, 
  createLab, 
  createSection, 
  createTextModule,
  ModuleType
} from '../types/models';

// In-memory storage for development
const mockLabsStorage: Map<string, Lab> = new Map();

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export async function mockCreateLab(request: CreateLabRequest): Promise<CreateLabResponse> {
  await delay(800); // Simulate network delay
  
  try {
    const newLab = createLab({
      title: request.title,
      description: request.description || '',
      author: { id: 'user-1', name: 'Test User' },
      status: 'draft',
      userId: 'user-1',
      sections: [
        createSection({
          title: 'Introduction',
          order: 0,
          modules: [
            createTextModule({
              title: 'Welcome',
              content: '<p>Welcome to your new lab!</p>',
              order: 0
            })
          ]
        })
      ]
    });
    
    mockLabsStorage.set(newLab.id, newLab);
    
    return {
      success: true,
      data: newLab
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create lab'
    };
  }
}

export async function mockGetLab(id: string): Promise<GetLabResponse> {
  await delay(600);
  
  const lab = mockLabsStorage.get(id);
  
  if (!lab) {
    return {
      success: false,
      error: 'Lab not found'
    };
  }
  
  return {
    success: true,
    data: { ...lab }
  };
}

export async function mockUpdateLab(request: UpdateLabRequest): Promise<UpdateLabResponse> {
  await delay(700);
  
  const { id, lab: updates } = request;
  const existingLab = mockLabsStorage.get(id);
  
  if (!existingLab) {
    return {
      success: false,
      error: 'Lab not found'
    };
  }
  
  const updatedLab: Lab = {
    ...existingLab,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  mockLabsStorage.set(id, updatedLab);
  
  return {
    success: true,
    data: updatedLab
  };
}

export async function mockDeployLab(id: string): Promise<DeployLabResponse> {
  await delay(1500); // Deployment takes longer
  
  const lab = mockLabsStorage.get(id);
  
  if (!lab) {
    return {
      success: false,
      error: 'Lab not found'
    };
  }
  
  // Update lab to published state
  const deployedLab: Lab = {
    ...lab,
    isPublished: true,
    publishedAt: new Date().toISOString(),
    publishedVersion: `v${Date.now().toString().slice(-6)}`,
  };
  
  mockLabsStorage.set(id, deployedLab);
  
  return {
    success: true,
    data: {
      deploymentUrl: `https://one-click-labs.example.com/labs/${id}`,
      deployedVersion: deployedLab.publishedVersion as string
    }
  };
}
