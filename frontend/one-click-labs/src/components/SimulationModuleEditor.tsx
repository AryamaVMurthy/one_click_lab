"use client";

import React, { useState, useEffect } from "react";
import { SimulationModule } from "@/types/models";
import SimulationCreator from "@/components/simulation/SimulationCreator";
import SimulationDisplay from "@/components/simulation/SimulationDisplay";
import Modal from "@/components/ui/Modal";

interface SimulationModuleEditorProps {
  module: SimulationModule;
  onChange: (updatedModule: SimulationModule) => void;
}

interface SimulationCreatorProps {
  initialHtml: string;
  initialJson: object | null;
  onHtmlGenerated: (html: string, json?: any) => void;
  onStructureGenerated: () => void;
  onCodeGenerated: () => void;
  onClose: () => void;
}

export default function SimulationModuleEditor({ module, onChange }: SimulationModuleEditorProps) {
  const [title, setTitle] = useState(module.title || "");
  const [description, setDescription] = useState(module.description || "");
  const [htmlContent, setHtmlContent] = useState(module.htmlContent || "");
  const [jsonStructure, setJsonStructure] = useState(module.jsonStructure || null);
  const [showCreator, setShowCreator] = useState(false);
  
  // Update component state when module prop changes
  useEffect(() => {
    setTitle(module.title || "");
    setDescription(module.description || "");
    setHtmlContent(module.htmlContent || "");
    setJsonStructure(module.jsonStructure || null);
  }, [module]);
  
  // Update module when title or description changes
  const handleInputChange = (field: 'title' | 'description', value: string) => {
    if (field === 'title') {
      setTitle(value);
    } else {
      setDescription(value);
    }
    
    onChange({
      ...module,
      [field]: value
    });
  };
  
  // Handle simulation content updates from SimulationCreator
  const handleSimulationGenerated = (html: string, json?: any) => {
    setHtmlContent(html);
    if (json) setJsonStructure(json);
    
    // Update the parent component with new content
    onChange({
      ...module,
      htmlContent: html,
      jsonStructure: json || module.jsonStructure
    });
  };
  
  // Close the creator popup
  const closeCreator = () => {
    setShowCreator(false);
  };

  return (
    <div>
      <div className="space-y-4">
        {/* Title input */}
        <div>
          <label htmlFor="simulation-title" className="block text-sm font-medium mb-1">
            Simulation Title
          </label>
          <input
            id="simulation-title"
            type="text"
            value={title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-border-color rounded-md bg-background"
            placeholder="Enter a title for this simulation"
          />
        </div>
        
        {/* Description input */}
        <div>
          <label htmlFor="simulation-description" className="block text-sm font-medium mb-1">
            Description (Optional)
          </label>
          <textarea
            id="simulation-description"
            value={description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-border-color rounded-md bg-background min-h-[80px]"
            placeholder="Enter a description for this simulation"
          />
        </div>
        
        {/* Preview and edit buttons */}
        <div className="rounded-lg border border-border-color overflow-hidden">
          <div className="p-3 bg-secondary/20 border-b border-border-color flex justify-between items-center">
            <h3 className="font-medium">Simulation Preview</h3>
            <button
              onClick={() => setShowCreator(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
            >
              Edit Simulation
            </button>
          </div>
          
          <div className="p-4 bg-background min-h-[300px]">
            {htmlContent ? (
              <SimulationDisplay htmlContent={htmlContent} />
            ) : (
              <div className="flex items-center justify-center h-64 bg-secondary/10 rounded-md">
                <p className="text-secondary-foreground">
                  No simulation content yet. Click "Edit Simulation" to create one.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Simulation Creator Modal */}
      <Modal
        isOpen={showCreator}
        onClose={closeCreator}
        title="Simulation Creator"
        size="fullscreen"
      >
        <div className="h-[80vh]">
          <SimulationCreator
            initialHtml={htmlContent}
            initialJson={jsonStructure}
            onHtmlGenerated={handleSimulationGenerated}
            onStructureGenerated={() => {}} // Not used directly, included for compatibility
            onCodeGenerated={() => {}} // Not used directly, included for compatibility
            onClose={closeCreator}
          />
        </div>
      </Modal>
    </div>
  );
}
