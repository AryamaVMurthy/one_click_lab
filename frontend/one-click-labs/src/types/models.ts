/**
 * Core data models for One Click Labs
 */

// Unique identifiers
export type ID = string;

// MongoDB document base with _id
export interface MongoDocument {
  _id?: string;
}

// Base interfaces
export interface BaseEntity {
  id: ID;
  createdAt: string;
  updatedAt: string;
}

// Lab Status type
export type LabStatus = 'draft' | 'published' | 'archived';

// Lab: Top-level container (aligned with MongoDB structure)
export interface Lab extends BaseEntity, MongoDocument {
  userId: string;
  title: string;
  description: string;
  status: LabStatus;
  sections: Section[];
  publishedVersion?: string;
  isPublished: boolean;
  publishedAt?: string;
  author?: {
    id: ID;
    name: string;
  };
  tags?: string[];
  visibility?: 'private' | 'public' | 'organization';
}

// Section: Container for modules
export interface Section extends BaseEntity {
  title: string;
  modules: Module[];
  order?: number; // Optional in MongoDB but useful for UI ordering
}

// Module type definitions
export type ModuleTypeString = 'text' | 'image' | 'video' | 'quiz' | 'simulation';

// Module type enumeration
export enum ModuleType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  QUIZ = 'quiz',
  SIMULATION = 'simulation',
}

// Base module interface (aligned with MongoDB)
export interface BaseModule extends BaseEntity {
  type: ModuleTypeString;
  title?: string; // May be optional in some module types
  order?: number;
}

// Text Module
export interface TextModule extends BaseModule {
  type: 'text';
  content: string; // Rich text content in HTML format
  format?: 'markdown' | 'html' | 'plain';
}

// Image Module
export interface ImageModule extends BaseModule {
  type: 'image';
  url: string;
  caption?: string;
  altText?: string;
  width?: number;
  height?: number;
}

// Video Module
export interface VideoModule extends BaseModule {
  type: 'video';
  url: string;
  provider?: 'youtube' | 'vimeo' | 'custom' | string;
  caption?: string;
  startTime?: number;
  endTime?: number;
  thumbnail?: string;
}

// Simulation Module
export interface SimulationModule extends BaseModule {
  type: 'simulation';
  htmlContent: string; // Complete HTML content including CSS and JS
  description?: string;
  jsonStructure?: string; // Changed from object to string - JSON stored as string
}

// Quiz types
export interface QuizQuestion {
  id: ID;
  text: string;
  type: 'multiple-choice' | 'multiple-answer' | 'true-false' | 'short-answer';
  options?: QuizOption[];
  correctAnswerIds?: ID[]; // Changed from correctAnswerId to support multiple answers
  correctAnswer?: string;
  points: number;
  explanation?: string;
}

export interface QuizOption {
  id: ID;
  text: string;
  isCorrect?: boolean; // Added for easier handling in the editor
}

// Quiz Module
export interface QuizModule extends BaseModule {
  type: 'quiz';
  questions: QuizQuestion[];
  passingScore?: number;
  allowRetries?: boolean;
  randomizeQuestions?: boolean;
  timeLimit?: number;
}

// Union type for all module types
export type Module = TextModule | ImageModule | VideoModule | QuizModule | SimulationModule;

// Helper type guard functions
export function isTextModule(module: Module): module is TextModule {
  return module.type === ModuleType.TEXT;
}

export function isImageModule(module: Module): module is ImageModule {
  return module.type === ModuleType.IMAGE;
}

export function isVideoModule(module: Module): module is VideoModule {
  return module.type === ModuleType.VIDEO;
}

export function isQuizModule(module: Module): module is QuizModule {
  return module.type === ModuleType.QUIZ;
}

export function isSimulationModule(module: Module): module is SimulationModule {
  return module.type === ModuleType.SIMULATION;
}

// Factory functions for creating new entities from MongoDB data or client-side
export const createLab = (partialLab: Partial<Lab>): Lab => {
  return {
    id: partialLab.id || crypto.randomUUID(),
    userId: partialLab.userId || '',
    title: partialLab.title || '',
    description: partialLab.description || '',
    status: partialLab.status || 'draft',
    sections: partialLab.sections || [],
    isPublished: partialLab.isPublished || false,
    createdAt: partialLab.createdAt || new Date().toISOString(),
    updatedAt: partialLab.updatedAt || new Date().toISOString(),
  };
};

// Factory function for creating a simulation module
export const createSimulationModule = (partialModule: Partial<SimulationModule> = {}): SimulationModule => {
  return {
    id: partialModule.id || crypto.randomUUID(),
    type: 'simulation',
    title: partialModule.title || 'New Simulation',
    htmlContent: partialModule.htmlContent || '',
    description: partialModule.description || '',
    jsonStructure: partialModule.jsonStructure || '',  // Changed from {} to ''
    createdAt: partialModule.createdAt || new Date().toISOString(),
    updatedAt: partialModule.updatedAt || new Date().toISOString(),
    order: partialModule.order !== undefined ? partialModule.order : 0,
  };
};

// Utility function to convert MongoDB document to our interface
export function mapMongoLabToLab(mongoLab: any): Lab {
  return {
    _id: mongoLab._id?.toString(),
    id: mongoLab.id,
    userId: mongoLab.userId,
    title: mongoLab.title,
    description: mongoLab.description,
    status: mongoLab.status,
    sections: mongoLab.sections.map((section: any) => ({
      id: section.id,
      title: section.title,
      modules: section.modules.map((module: any) => {
        // Base module properties
        const baseModule = {
          id: module.id,
          type: module.type,
          title: module.title,
          createdAt: module.createdAt || mongoLab.createdAt,
          updatedAt: module.updatedAt || mongoLab.updatedAt,
        };

        // Return type-specific module
        switch (module.type) {
          case 'text':
            return {
              ...baseModule,
              content: module.content,
            } as TextModule;
          case 'image':
            return {
              ...baseModule,
              url: module.url,
              caption: module.caption,
              altText: module.altText,
            } as ImageModule;
          case 'video':
            return {
              ...baseModule,
              url: module.url,
              provider: module.provider,
            } as VideoModule;
          case 'quiz':
            return {
              ...baseModule,
              questions: module.questions,
              allowRetries: module.allowRetries,
            } as QuizModule;
          case 'simulation':
            return {
              ...baseModule,
              htmlContent: module.htmlContent,
              description: module.description,
              jsonStructure: module.jsonStructure,
            } as SimulationModule;
          default:
            return baseModule as BaseModule;
        }
      }),
      createdAt: section.createdAt || mongoLab.createdAt,
      updatedAt: section.updatedAt || mongoLab.updatedAt,
    })),
    isPublished: mongoLab.status === 'published',
    publishedAt: mongoLab.publishedAt,
    createdAt: mongoLab.createdAt,
    updatedAt: mongoLab.updatedAt,
  };
}

// Factory functions - updated to use string literals consistently
export const createSection = (partialSection: Partial<Section>): Section => {
  return {
    id: crypto.randomUUID(),
    title: '',
    modules: [],
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partialSection,
  };
};

export const createTextModule = (partialModule: Partial<TextModule>): TextModule => {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    title: '',
    content: '',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partialModule,
  };
};

export const createImageModule = (partialModule: Partial<ImageModule>): ImageModule => {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    title: '',
    url: '',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partialModule,
  };
};

export const createVideoModule = (partialModule: Partial<VideoModule>): VideoModule => {
  return {
    id: crypto.randomUUID(),
    type: 'video',
    title: '',
    url: '',
    provider: 'youtube',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partialModule,
  };
};

export const createQuizModule = (partialModule: Partial<QuizModule>): QuizModule => {
  return {
    id: crypto.randomUUID(),
    type: 'quiz',
    title: '',
    questions: [],
    allowRetries: true,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partialModule,
  };
};

export const createQuizQuestion = (partialQuestion: Partial<QuizQuestion> = {}): QuizQuestion => {
  return {
    id: crypto.randomUUID(),
    text: '',
    type: 'multiple-answer',
    options: [],
    points: 1,
    ...partialQuestion,
  };
};

export const createQuizOption = (partialOption: Partial<QuizOption> = {}): QuizOption => {
  return {
    id: crypto.randomUUID(),
    text: '',
    isCorrect: false,
    ...partialOption,
  };
};

// User types
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: string;
}
