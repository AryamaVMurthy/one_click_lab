"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Section, 
  Module, 
  TextModule, 
  QuizModule, 
  createTextModule, 
  createQuizModule,
  isTextModule,
  isQuizModule
} from "@/types/models";
import TextModuleEditor from "@/components/TextModuleEditor";
import QuizModuleEditor from "@/components/QuizModuleEditor";
import ConfirmationModal from "@/components/ConfirmationModal";

interface SectionEditorProps {
  section: Section;
  onChange: (updatedSection: Section) => void;
  onDelete?: () => void;
}

export default function SectionEditor({ 
  section, 
  onChange,
  onDelete 
}: SectionEditorProps) {
  const [title, setTitle] = useState(section.title || "");
  const [modules, setModules] = useState<Module[]>(section.modules || []);
  const [showAddModuleMenu, setShowAddModuleMenu] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  // Update internal state when section prop changes - we need to preserve expanded state
  useEffect(() => {
    setTitle(section.title || "");
    setModules(section.modules || []);
    // Don't reset expandedModuleId here - it causes modules to collapse
  }, [section.id, section.title, section.modules]);

  // Update section title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onChange({
      ...section,
      title: newTitle,
    });
  };

  // Update a specific module
  const handleModuleChange = (updatedModule: Module) => {
    const updatedModules = modules.map((mod) =>
      mod.id === updatedModule.id ? updatedModule : mod
    );
    setModules(updatedModules);
    onChange({
      ...section,
      modules: updatedModules,
    });
  };

  // Add a new module
  const addModule = (type: 'text' | 'quiz') => {
    let newModule: Module;
    
    if (type === 'text') {
      newModule = createTextModule({
        title: 'New Text Module',
        order: modules.length,
      });
    } else {
      newModule = createQuizModule({
        title: 'New Quiz Module',
        order: modules.length,
      });
    }
    
    const updatedModules = [...modules, newModule];
    setModules(updatedModules);
    onChange({
      ...section,
      modules: updatedModules,
    });
    
    // Expand the newly added module - set timeout to ensure state update completes
    setTimeout(() => {
      setExpandedModuleId(newModule.id);
    }, 50);
    
    setShowAddModuleMenu(false);
  };

  // Remove a module
  const removeModule = (moduleId: string) => {
    const updatedModules = modules.filter(mod => mod.id !== moduleId);
    setModules(updatedModules);
    onChange({
      ...section,
      modules: updatedModules,
    });
  };

  // Handle drag-and-drop reordering
  const handleDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) return;

    const reorderedModules = Array.from(modules);
    const [removed] = reorderedModules.splice(result.source.index, 1);
    reorderedModules.splice(result.destination.index, 0, removed);

    // Update order property on each module
    const modulesWithUpdatedOrder = reorderedModules.map((mod, index) => ({
      ...mod,
      order: index,
    }));

    setModules(modulesWithUpdatedOrder);
    onChange({
      ...section,
      modules: modulesWithUpdatedOrder,
    });
  };

  // Toggle module expansion - prevent event bubbling
  const toggleModuleExpansion = (moduleId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedModuleId(expandedModuleId === moduleId ? null : moduleId);
  };

  // Delete section (with confirmation)
  const handleDeleteSection = () => {
    setShowDeleteConfirmation(true);
  };

  // Confirm section deletion
  const confirmDeleteSection = () => {
    setShowDeleteConfirmation(false);
    if (onDelete) onDelete();
  };

  return (
    <div className="bg-card border border-border-color rounded-lg shadow-sm p-4 mb-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <div className="flex-1">
          <label htmlFor="section-title" className="block text-sm font-medium mb-1 text-foreground">
            Section Title
          </label>
          <input
            id="section-title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="w-full px-3 py-2 border border-border-color rounded-md bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="Enter a title for this section"
          />
        </div>
        
        <div className="flex gap-2 self-end md:self-auto">
          <button 
            onClick={() => setShowAddModuleMenu(!showAddModuleMenu)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md border border-border-color hover:bg-secondary/80 transition-colors flex items-center"
          >
            <PlusIcon className="mr-1" />
            Add Module
          </button>
          
          {onDelete && (
            <button 
              onClick={handleDeleteSection}
              className="px-4 py-2 bg-red-500/10 text-red-500 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-500/20 hover:bg-red-500/20 transition-colors"
              aria-label="Delete section"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {/* Add Module Menu (Conditional) */}
      {showAddModuleMenu && (
        <div className="mb-4 p-3 bg-background border border-border-color rounded-md">
          <h3 className="text-sm font-medium mb-2 text-foreground">Select Module Type:</h3>
          <div className="flex gap-2">
            <button
              onClick={() => addModule('text')}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md flex items-center"
            >
              <DocumentIcon className="mr-1" />
              Text Module
            </button>
            <button
              onClick={() => addModule('quiz')}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md flex items-center"
            >
              <QuizIcon className="mr-1" />
              Quiz Module
            </button>
          </div>
        </div>
      )}

      {/* Module List with Drag and Drop */}
      {modules.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="modules">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {modules.map((module, index) => (
                  <Draggable key={module.id} draggableId={module.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-background border border-border-color rounded-md overflow-hidden ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        {/* Module Header - Draggable Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="bg-secondary p-3 flex justify-between items-center cursor-grab"
                        >
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-2 flex-shrink-0">
                              <DragHandleIcon />
                            </span>
                            <div>
                              <span className="font-medium text-foreground">{module.title || 'Untitled Module'}</span>
                              <span className="ml-2 text-xs text-secondary-foreground/70 bg-background/50 px-2 py-0.5 rounded">
                                {module.type.charAt(0).toUpperCase() + module.type.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => toggleModuleExpansion(module.id, e)}
                              className="text-secondary-foreground hover:text-foreground transition-colors"
                              aria-label={expandedModuleId === module.id ? "Collapse module" : "Expand module"}
                            >
                              {expandedModuleId === module.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeModule(module.id);
                              }}
                              className="text-red-500 hover:text-red-600 transition-colors"
                              aria-label="Remove module"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>

                        {/* Module Content (conditionally shown) */}
                        {expandedModuleId === module.id && (
                          <div 
                            className="p-3" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isTextModule(module) && (
                              <TextModuleEditor 
                                module={module} 
                                onChange={(updated) => handleModuleChange(updated as TextModule)} 
                              />
                            )}
                            {isQuizModule(module) && (
                              <QuizModuleEditor 
                                module={module} 
                                onChange={(updated) => handleModuleChange(updated as QuizModule)} 
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="text-center p-8 bg-background border border-dashed border-border-color rounded-md">
          <p className="text-secondary-foreground">No modules yet. Click "Add Module" to create your first module.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteSection}
        title="Delete Section?"
        message="Are you sure you want to delete this section? This action cannot be undone and all modules within this section will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDanger
      />
    </div>
  );
}

// Icons
function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14M5 12h14" /></svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
  );
}

function DragHandleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10-14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-2 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path></svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  );
}

function DocumentIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
  );
}

function QuizIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
  );
}
