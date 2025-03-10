'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Handle, 
  Position, 
  useNodesState, 
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

interface SimulationStructureProps {
  simulationData: any;
  onStructureChange: (structure: any) => void;
}

// New component for hierarchical view
const StructureSection: React.FC<{
  label: string;
  type: string;
  content: any;
  path: string;
  onEdit: (path: string, value: any) => void;
  depth: number;
  searchTerm: string;
}> = ({ label, type, content, path, onEdit, depth, searchTerm }) => {
  // Initialize as collapsed, except for top-level (depth 0) or when there's a search match
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  
  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  const isPrimitive = typeof content !== 'object' || content === null;
  const isArray = Array.isArray(content);
  
  // Check if this node or any children match the search term
  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check if the label matches
    if (label.toLowerCase().includes(searchLower)) return true;
    
    // For primitives, check if the content matches
    if (isPrimitive) {
      return String(content).toLowerCase().includes(searchLower);
    }
    
    // For objects/arrays, check if any key or value matches
    if (isArray) {
      return content.some((item: any) => 
        typeof item === 'object' 
          ? JSON.stringify(item).toLowerCase().includes(searchLower)
          : String(item).toLowerCase().includes(searchLower)
      );
    }
    
    // For objects, check keys and values
    return Object.entries(content).some(([key, value]) => 
      key.toLowerCase().includes(searchLower) || 
      (typeof value === 'object' 
        ? JSON.stringify(value).toLowerCase().includes(searchLower)
        : String(value).toLowerCase().includes(searchLower))
    );
  }, [label, content, searchTerm, isPrimitive, isArray]);
  
  // Auto-expand when search matches are found
  useEffect(() => {
    if (searchTerm && matchesSearch) {
      setIsExpanded(true);
    } else if (searchTerm === '' && depth !== 0) {
      // Collapse when search is cleared (except top level)
      setIsExpanded(false);
    }
  }, [searchTerm, matchesSearch, depth]);
  
  // If there's no match and no search term is empty, don't render
  if (searchTerm && !matchesSearch) return null;
  
  // Rest of the functionality remains the same
  const startEditing = () => {
    setEditValue(isPrimitive ? String(content) : JSON.stringify(content, null, 2));
    setIsEditing(true);
  };
  
  const saveChanges = () => {
    try {
      const newValue = isPrimitive 
        ? (type === 'number' ? Number(editValue) : editValue) 
        : JSON.parse(editValue);
      onEdit(path, newValue);
      setIsEditing(false);
    } catch (error) {
      alert(`Invalid format: ${(error as Error).message}`);
    }
  };

  const bgColor = depth === 0 ? 'bg-primary/5' : 
                depth === 1 ? 'bg-secondary/5' : 
                depth === 2 ? 'bg-accent/5' : 'bg-background';

  // Helper function to highlight text that matches search term
  const highlightMatches = (text: string): React.ReactNode => {
    if (!searchTerm) return text;
    
    const searchRegex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(searchRegex);
    
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <span key={i} className="bg-yellow-200 text-black px-0.5 rounded">{part}</span> 
        : part
    );
  };

  const renderContent = () => {
    if (isPrimitive) {
      return (
        <div className="flex items-center justify-between py-1.5 px-3">
          <div className="flex items-center">
            <span className="font-medium mr-2">{highlightMatches(label)}:</span>
            <span className={`${content === undefined || content === null ? 'italic text-muted-foreground' : ''}`}>
              {content === undefined ? 'undefined' : 
               content === null ? 'null' : 
               highlightMatches(String(content))}
            </span>
          </div>
          <button 
            onClick={startEditing} 
            className="p-1 text-primary hover:text-primary/80"
            title="Edit value"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between py-2 px-3">
          <div className="flex items-center">
            <button 
              onClick={toggleExpand} 
              className="mr-2 p-1 hover:bg-background rounded"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                )}
              </svg>
            </button>
            <span className="font-medium">{highlightMatches(label)}</span>
            <span className="ml-2 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {isArray ? 'array' : 'object'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              onClick={startEditing}
              className="p-1 text-primary hover:text-primary/80"
              title="Edit as JSON"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {isArray && (
              <button 
                onClick={() => onEdit(path, [...content, null])}
                className="p-1 text-green-600 hover:text-green-700"
                title="Add item"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="pl-4 border-l border-border-color ml-3 my-1">
            {isArray ? (
              content.map((item: any, index: number) => (
                <StructureSection
                  key={`${path}.${index}`}
                  label={`[${index}]`}
                  type={typeof item}
                  content={item}
                  path={`${path}.${index}`}
                  onEdit={onEdit}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                />
              ))
            ) : (
              Object.entries(content).map(([key, value]) => (
                <StructureSection
                  key={`${path}.${key}`}
                  label={key}
                  type={typeof value}
                  content={value}
                  path={`${path}.${key}`}
                  onEdit={onEdit}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                />
              ))
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className={`mb-2 rounded-md border border-border-color ${bgColor} overflow-hidden`}>
      {isEditing ? (
        <div className="p-3">
          <div className="mb-2 font-medium">{label}</div>
          <textarea 
            className="w-full p-3 h-40 font-mono text-sm border rounded bg-card text-card-foreground"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded"
            >
              Cancel
            </button>
            <button 
              onClick={saveChanges}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded"
            >
              Save
            </button>
          </div>
        </div>
      ) : renderContent()}
    </div>
  );
};

// Main component
const SimulationStructure: React.FC<SimulationStructureProps> = ({
  simulationData,
  onStructureChange,
}) => {
  const [viewMode, setViewMode] = useState<'hierarchical' | 'json'>('hierarchical');
  const [jsonText, setJsonText] = useState(() => 
    JSON.stringify(simulationData || {}, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Update JSON text when structure changes
  useEffect(() => {
    setJsonText(JSON.stringify(simulationData || {}, null, 2));
  }, [simulationData]);
  
  // Handle JSON text changes
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    setJsonError(null);
  };
  
  // Apply JSON changes
  const applyJsonChanges = () => {
    try {
      const newStructure = JSON.parse(jsonText);
      onStructureChange(newStructure);
      setJsonError(null);
    } catch (error) {
      setJsonError(`Invalid JSON: ${(error as Error).message}`);
    }
  };
  
  // Handle edits from hierarchical view
  const handleEdit = (path: string, value: any) => {
    // Parse the path and update the structure
    const pathParts = path.split('.').filter(Boolean);
    const newStructure = JSON.parse(JSON.stringify(simulationData));
    
    let current = newStructure;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      current = current[part];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    onStructureChange(newStructure);
  };
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-border-color">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-primary">Simulation Structure</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('hierarchical')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'hierarchical'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Hierarchical View
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'json'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              JSON View
            </button>
          </div>
        </div>
        
        {/* Search input */}
        <div className="mt-4 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search structure..."
            className="w-full py-2 pl-10 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchTerm && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'hierarchical' ? (
          <div className="space-y-4">
            <StructureSection
              label="Simulation"
              type="object"
              content={simulationData}
              path=""
              onEdit={handleEdit}
              depth={0}
              searchTerm={searchTerm}
            />
          </div>
        ) : (
          <div className="h-full">
            <div className="flex flex-col h-full">
              {jsonError && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {jsonError}
                </div>
              )}
              <div className="flex-1 mb-4">
                <textarea
                  value={jsonText}
                  onChange={handleJsonChange}
                  className="w-full h-full p-4 border rounded font-mono text-sm bg-card text-foreground"
                  spellCheck={false}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={applyJsonChanges}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationStructure;
