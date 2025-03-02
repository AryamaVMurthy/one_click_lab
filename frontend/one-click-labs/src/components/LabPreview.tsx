"use client";

import React, { useState } from "react";
import { Lab, Section, Module, isTextModule, isQuizModule, QuizQuestion } from "@/types/models";
import ModuleRenderer from "@/components/ModuleRenderer";

interface LabPreviewProps {
  lab: Lab;
  onExitPreview: () => void;
}

export default function LabPreview({ lab, onExitPreview }: LabPreviewProps) {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  // Get current section and module
  const currentSection = lab.sections[activeSectionIndex] || null;
  const currentModule = currentSection?.modules[activeModuleIndex] || null;

  // Navigation functions
  const goToNextModule = () => {
    if (!currentSection) return;

    // Mark current module as completed
    if (currentModule) {
      setProgress(prev => ({ ...prev, [currentModule.id]: true }));
    }

    if (activeModuleIndex < currentSection.modules.length - 1) {
      // Go to next module in current section
      setActiveModuleIndex(activeModuleIndex + 1);
    } else if (activeSectionIndex < (lab.sections.length - 1)) {
      // Go to first module of next section
      setActiveSectionIndex(activeSectionIndex + 1);
      setActiveModuleIndex(0);
    }
  };

  const goToPrevModule = () => {
    if (activeModuleIndex > 0) {
      // Go to previous module in current section
      setActiveModuleIndex(activeModuleIndex - 1);
    } else if (activeSectionIndex > 0) {
      // Go to last module of previous section
      const prevSection = lab.sections[activeSectionIndex - 1];
      if (prevSection) {
        setActiveSectionIndex(activeSectionIndex - 1);
        setActiveModuleIndex(prevSection.modules.length - 1);
      }
    }
  };

  const goToModule = (sectionIndex: number, moduleIndex: number) => {
    if (
      sectionIndex >= 0 && 
      sectionIndex < lab.sections.length && 
      moduleIndex >= 0 && 
      moduleIndex < lab.sections[sectionIndex].modules.length
    ) {
      setActiveSectionIndex(sectionIndex);
      setActiveModuleIndex(moduleIndex);
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    let completedCount = 0;
    let totalCount = 0;
    
    lab.sections.forEach(section => {
      section.modules.forEach(module => {
        totalCount++;
        if (progress[module.id]) completedCount++;
      });
    });
    
    return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  };

  // Check if we're on the last module of the lab
  const isLastModule = () => 
    activeSectionIndex === lab.sections.length - 1 &&
    activeModuleIndex === (currentSection?.modules.length || 0) - 1;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with lab information and exit button */}
      <header className="sticky top-0 z-10 bg-card border-b border-border-color shadow-sm px-4 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-foreground">{lab.title}</h1>
            <p className="text-sm text-secondary-foreground mt-1">Preview Mode</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <span className="text-sm text-secondary-foreground">
                {Math.round(calculateProgress())}%
              </span>
            </div>
            
            {/* Exit preview button */}
            <button
              onClick={onExitPreview}
              className="px-4 py-2 border border-border-color rounded-md bg-secondary/50 hover:bg-secondary text-foreground flex items-center gap-1.5"
            >
              <ExitIcon />
              Exit Preview
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with sections */}
        <div className="w-72 flex-shrink-0 bg-card border-r border-border-color flex flex-col h-full">
          <div className="p-4 border-b border-border-color">
            <h2 className="font-bold text-foreground">Lab Content</h2>
            <p className="text-sm text-secondary-foreground mt-1">
              {lab.sections.length} sections · {lab.sections.reduce((count, section) => count + section.modules.length, 0)} modules
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {lab.sections.map((section, sectionIdx) => (
              <div key={section.id} className="border-b border-border-color last:border-0">
                <div 
                  className={`px-4 py-3 font-medium cursor-pointer transition-colors ${
                    activeSectionIndex === sectionIdx 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => {
                    setActiveSectionIndex(sectionIdx);
                    setActiveModuleIndex(0);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2">{sectionIdx + 1}. {section.title}</span>
                    {/* Progress indicators per section */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-secondary-foreground px-1.5 py-0.5 bg-secondary rounded-full">
                        {section.modules.filter(m => progress[m.id]).length}/{section.modules.length}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Module list for current section */}
                {activeSectionIndex === sectionIdx && (
                  <ul className="ml-6 space-y-1 py-2 border-t border-border-color/30">
                    {section.modules.map((module, moduleIdx) => {
                      const isActive = activeSectionIndex === sectionIdx && activeModuleIndex === moduleIdx;
                      const isCompleted = progress[module.id];
                      
                      // Determine icon based on module type and completion status
                      const getModuleIcon = () => {
                        if (isCompleted) return <CheckCircleIcon className="text-green-500 dark:text-green-400" />;
                        if (isQuizModule(module)) return <QuizIcon />;
                        return <DocumentTextIcon />;
                      };
                      
                      return (
                        <li key={module.id}>
                          <button 
                            className={`px-3 py-2 w-full text-left text-sm rounded-md flex items-center gap-2 ${
                              isActive 
                                ? "bg-primary/20 text-primary" 
                                : isCompleted 
                                  ? "text-secondary-foreground hover:bg-secondary/70" 
                                  : "hover:bg-secondary"
                            }`}
                            onClick={() => goToModule(sectionIdx, moduleIdx)}
                          >
                            <span className="w-4 h-4 flex-shrink-0">
                              {getModuleIcon()}
                            </span>
                            <span className="truncate">
                              {module.title || `Module ${moduleIdx + 1}`}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 md:px-8 py-8 max-w-4xl">
            {/* Module content */}
            {currentModule ? (
              <div className="flex flex-col">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-secondary-foreground mb-1">
                      <span>Section {activeSectionIndex + 1}: {currentSection?.title}</span>
                      <ChevronRightIcon className="h-3 w-3" />
                      <span>Module {activeModuleIndex + 1}/{currentSection?.modules.length}</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      {currentModule.title || `Module ${activeModuleIndex + 1}`}
                    </h1>
                  </div>
                </div>
                
                {/* Module renderer */}
                <div className="bg-card border border-border-color rounded-xl p-6 shadow-sm">
                  <ModuleRenderer
                    module={currentModule}
                    onComplete={() => {
                      setProgress(prev => ({ ...prev, [currentModule.id]: true }));
                    }}
                  />
                </div>
                
                {/* Navigation buttons */}
                <div className="mt-8 flex justify-between">
                  <button
                    onClick={goToPrevModule}
                    disabled={activeSectionIndex === 0 && activeModuleIndex === 0}
                    className={`px-4 py-2 rounded-md border flex items-center ${
                      activeSectionIndex === 0 && activeModuleIndex === 0
                        ? "border-border-color text-secondary-foreground/40 cursor-not-allowed"
                        : "border-border-color hover:bg-secondary text-foreground"
                    }`}
                  >
                    <ChevronLeftIcon className="mr-2" />
                    Previous
                  </button>
                  
                  <button
                    onClick={goToNextModule}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center"
                  >
                    {isLastModule() ? (
                      <>
                        Finish Lab
                        <CheckIcon className="ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRightIcon className="ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                  <AlertIcon className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h2 className="text-xl font-medium text-foreground mb-2">
                  No content available
                </h2>
                <p className="text-secondary-foreground max-w-md mx-auto">
                  This lab has no modules. Please add content to this lab.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function ExitIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );
}

function ChevronLeftIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
}

function ChevronRightIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
}

function DocumentTextIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
}

function CheckCircleIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}

function QuizIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>;
}

function AlertIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}

function CheckIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
