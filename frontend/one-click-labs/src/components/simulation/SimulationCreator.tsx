'use client';

import React, { useState, useEffect } from 'react';
import SimulationStructure from './SimulationStructure';
import SimulationPreview from './SimulationPreview';
import SimulationChatBot from './SimulationChatBot';
import SimulationCodeViewer from './SimulationCodeViewer';
import { processSimulationResponse } from '@/api/apiClient';
import { SimulationResponse } from '@/types/api';

interface SimulationCreatorProps {
  initialHtml?: string;
  initialJson?: any;
  onHtmlGenerated: (html: string, json?: any) => void;
  onStructureGenerated: (structure: any) => void; 
  onCodeGenerated: (htmlContent?: string) => void;
  onClose?: () => void;
}

const SimulationCreator: React.FC<SimulationCreatorProps> = ({
  initialHtml = '',
  initialJson = null,
  onHtmlGenerated,
  onStructureGenerated,
  onCodeGenerated,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'structure' | 'code' | 'preview'>('structure');
  const [structure, setStructure] = useState(initialJson || {
    simulation_name: "New Simulation",
    description: "Interactive simulation",
    domain: "physics",
    // Default structure can be provided here or loaded from initialJson
    // We'll use initialJson if provided, otherwise start with empty structure
  });
  
  const [generatedJson, setGeneratedJson] = useState({});
  const [generatedHtml, setGeneratedHtml] = useState(initialHtml);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Update html/json when initialHtml/initialJson changes
  useEffect(() => {
    if (initialHtml) {
      setGeneratedHtml(initialHtml);
    }
    if (initialJson) {
      setStructure(initialJson);
    }
  }, [initialHtml, initialJson]);

  const handleStructureChange = (newStructure: any) => {
    setStructure(newStructure);
    onStructureGenerated(newStructure);
  };

  const handleSimulationResponse = (response: SimulationResponse) => {
    const processed = processSimulationResponse(response);
    
    // Set JSON response if available
    if (processed.json) {
      setGeneratedJson(processed.json);
    }
    
    // Store the complete HTML response without splitting
    if (processed.html) {
      setGeneratedHtml(processed.html);
      // Call the callback to update parent component
      onHtmlGenerated(processed.html, processed.json);
    }
    
    // Automatically switch to the appropriate tab
    if (processed.html) {
      setActiveTab('preview');
    } else if (processed.json) {
      setActiveTab('structure');
    }
  };

  // Handle chatbot-generated code
  const handleChatbotCodeGeneration = async (htmlContent: string) => {
    setGeneratedHtml(htmlContent);
    setActiveTab('preview');
    setIsLoading(false);
    
    // Call the callback to update parent component
    onHtmlGenerated(htmlContent);
  };

  // Handle chatbot generation
  const handleChatbotGeneration = (htmlContent?: string) => {
    setIsLoading(true);
    
    // If HTML was provided, set it and switch to the preview tab
    if (htmlContent) {
      setGeneratedHtml(htmlContent);
      setActiveTab('preview');
      setIsLoading(false);
      
      // Call the callback to update parent component
      onHtmlGenerated(htmlContent);
    }
    
    // Delegate to the provided onCodeGenerated
    onCodeGenerated(htmlContent);
  };

  // Save changes and close the editor
  const handleSaveChanges = () => {
    onHtmlGenerated(generatedHtml, structure);
    if (onClose) onClose();
  };

  return (
    <div className="flex h-full bg-background">
      {/* Left Panel - Tabs Navigation */}
      <div className="w-48 border-r border-border-color">
        <nav className="flex flex-col py-4 space-y-4">
          <button
            onClick={() => setActiveTab('structure')}
            className={`p-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'structure'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-background'
            }`}
            title="Structure View"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span>Structure</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`p-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'code'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-background'
            }`}
            title="Code View"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span>HTML Code</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`p-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-background'
            }`}
            title="Preview"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>Preview</span>
          </button>
          
          {onClose && (
            <button
              onClick={handleSaveChanges}
              className="mt-auto p-2 rounded-lg flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700"
              title="Save changes"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Save</span>
            </button>
          )}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Main Panel */}
          <div className="flex-1 p-4">
            {activeTab === 'structure' && (
              <SimulationStructure
                simulationData={structure}
                onStructureChange={handleStructureChange}
              />
            )}
            {activeTab === 'code' && (
              <SimulationCodeViewer
                htmlContent={generatedHtml} // Pass the complete HTML
                cssContent="" // These won't be used but keep them to avoid prop type errors
                jsContent=""
              />
            )}
            {activeTab === 'preview' && (
              <SimulationPreview
                html={generatedHtml} // Pass the complete HTML
                isLoading={isLoading}
                error={error}
              />
            )}
          </div>

          {/* Chatbot Panel - Now permanently visible */}
          <div className="w-96 border-l border-border-color">
            <SimulationChatBot
              onStructureGenerated={handleStructureChange}
              onCodeGenerated={handleChatbotGeneration} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationCreator;
