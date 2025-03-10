'use client';

import React, { useState } from 'react';
import SimulationStructure from './SimulationStructure';
import SimulationPreview from './SimulationPreview';
import SimulationChatBot from './SimulationChatBot';
import SimulationCodeViewer from './SimulationCodeViewer';
import { processSimulationResponse } from '../../api/apiClient';
import { SimulationResponse } from '../../types/api';

// Update the interfaces to match the component usage
interface SimulationStructureProps {
  simulationData: any;
  onStructureChange: (structure: any) => void;
}

// The other interfaces remain the same
interface SimulationCodeViewerProps {
  jsContent: string;
  htmlContent: string;
  cssContent: string;
}

interface SimulationPreviewProps {
  html: string;
  isLoading: boolean;
  error?: string;
}

const SimulationCreator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'structure' | 'code' | 'preview'>('structure');
  const [structure, setStructure] = useState({
    simulation_name: "Simple Pendulum",
    description: "A basic pendulum simulation to demonstrate periodic motion",
    domain: "physics",
    system: {
      type: "physical",
      entities: [
        {
          type: "object",
          id: "bob",
          properties: {
            mass: "mass",
            radius: "radius"
          },
          connections: ["string"],
          interactive_properties: {
            draggable: true,
            clickable: true,
            hoverable: true
          }
        },
        {
          type: "object",
          id: "pivot",
          properties: {
            fixed: true
          }
        }
      ],
      context: {
        type: "environment",
        properties: {
          gravity: "gravity"
        }
      }
    },
    state: [
      {
        name: "mass",
        symbol: "m",
        type: "number",
        unit: "kg",
        adjustable: true,
        range: [0.1, 5],
        default: 1,
        calculated: false
      },
      {
        name: "length",
        symbol: "L",
        type: "number",
        unit: "m",
        adjustable: true,
        range: [0.5, 3],
        default: 1,
        calculated: false
      },
      {
        name: "angle",
        symbol: "θ",
        type: "number",
        unit: "rad",
        adjustable: true,
        range: [-Math.PI/2, Math.PI/2],
        default: 0.5,
        calculated: false
      },
      {
        name: "radius",
        symbol: "r",
        type: "number",
        unit: "m",
        adjustable: true,
        range: [0.05, 0.3],
        default: 0.1,
        calculated: false
      },
      {
        name: "gravity",
        symbol: "g",
        type: "number",
        unit: "m/s²",
        adjustable: true,
        range: [1, 20],
        default: 9.8,
        calculated: false
      },
      {
        name: "period",
        symbol: "T",
        type: "number",
        unit: "s",
        adjustable: false,
        calculated: true,
        formula: "2 * Math.PI * Math.sqrt(length / gravity)"
      }
    ],
    constants: [
      {
        name: "pi",
        symbol: "π",
        value: 3.14159,
        unit: ""
      }
    ],
    rules: [
      {
        target: "angle",
        formula: "angle0 * Math.cos(Math.sqrt(gravity / length) * time)",
        condition: "time >= 0",
        type: "equation"
      }
    ],
    inputs: [
      {
        state: "angle",
        type: "slider",
        label: "Initial Angle",
        properties: {
          min: -1.57,
          max: 1.57,
          step: 0.01
        }
      },
      {
        state: "mass",
        type: "slider",
        label: "Mass",
        properties: {
          min: 0.1,
          max: 5,
          step: 0.1
        }
      },
      {
        type: "button",
        label: "Start/Stop",
        properties: {
          action: "toggleSimulation"
        }
      }
    ],
    presentation: {
      scene: {
        type: "2d",
        objects: [
          {
            type: "circle",
            id: "bob",
            properties: {
              radius: 10,
              color: "#4B5563",
              position: "calculateBobPosition"
            }
          },
          {
            type: "line",
            properties: {
              strokeWidth: 2,
              color: "#4B5563",
              from: "pivotPosition",
              to: "bobPosition"
            }
          }
        ]
      },
      graphs: [
        {
          x_axis: "time",
          y_axis: "angle",
          label: "Angle vs Time",
          style: "line",
          properties: {
            color: "#2563EB",
            grid: true
          }
        }
      ],
      outputs: [
        {
          state: "period",
          label: "Period",
          format: "%.2f s"
        }
      ],
      indicators: [
        {
          type: "gauge",
          state: "angle",
          properties: {
            unit: "rad",
            position: "top-right"
          }
        }
      ]
    },
    constraints: [
      {
        expression: "mass > 0",
        message: "Mass must be positive"
      },
      {
        expression: "length > 0",
        message: "Length must be positive"
      }
    ],
    tools: [
      {
        type: "timer",
        id: "simulation-timer",
        label: "Simulation Time",
        properties: {
          unit: "s",
          precision: 2
        }
      },
      {
        type: "measure",
        id: "angle-measure",
        label: "Angle Measurement",
        properties: {
          unit: "rad",
          precision: 2
        }
      }
    ],
    interactions: [
      {
        entity_id: "bob",
        event: "drag",
        action: "updateAngle",
        properties: {
          constraint: "circular"
        }
      }
    ],
    assets: [
      {
        id: "background",
        type: "image",
        src: "images/grid.png",
        properties: {
          alt: "Background Grid"
        }
      }
    ],
    additional_points: {
      author: "One Click Labs",
      version: "1.0",
      educational_level: "high-school"
    }
  });

  const [generatedJson, setGeneratedJson] = useState({});
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleStructureChange = (newStructure: any) => {
    setStructure(newStructure);
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
    } else {
      setGeneratedHtml("");
    }
    
    // Automatically switch to the appropriate tab
    if (processed.html) {
      setActiveTab('preview');
    } else if (processed.json) {
      setActiveTab('structure');
    }
  };

  const generateSimulation = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await fetch('/api/simulations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          structure: structure,
          configuration: {}, // Assuming configuration is an empty object
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate simulation');
      }

      const data = await response.json();
      handleSimulationResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new function to handle chatbot-generated code
  const handleChatbotCodeGeneration = async (htmlContent: string) => {
    setGeneratedHtml(htmlContent);
    setActiveTab('preview');
    setIsLoading(false);
  };

  // Update this function to accept HTML content
  const handleChatbotGeneration = (htmlContent?: string) => {
    setIsLoading(true);
    
    // If HTML was provided, set it and switch to the preview tab
    if (htmlContent) {
      console.log("Received HTML in parent component of length:", htmlContent.length);
      setGeneratedHtml(htmlContent);
      setActiveTab('preview');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
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
            <span>View Structure</span>
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
            <span>View HTML Code</span>
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
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="p-4 border-b border-border-color">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 text-transparent bg-clip-text animate-gradient">
            Simulation Creator
          </h1>
        </header>

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

      {/* Add some global styles for the gradient animation */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SimulationCreator;
