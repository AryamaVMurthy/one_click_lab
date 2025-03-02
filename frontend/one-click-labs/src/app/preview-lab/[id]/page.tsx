"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { mockGetLab } from "@/api/mockApi";
import { Lab, Section, Module, isTextModule, isQuizModule } from "@/types/models";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import ModuleRenderer from "@/components/ModuleRenderer";
import { formatDistanceToNow } from "@/utils/date";
import ExportLabButton from "@/components/ExportLabButton";

export default function PreviewLabPage() {
  const { theme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const labId = params.id as string;
  
  // State
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  // Load lab data
  useEffect(() => {
    async function fetchLab() {
      try {
        setLoading(true);
        const response = await mockGetLab(labId);
        if (response.success && response.data) {
          setLab(response.data);
          // Initialize progress tracking
          const initialProgress: Record<string, boolean> = {};
          response.data.sections.forEach(section => {
            section.modules.forEach(module => {
              initialProgress[module.id] = false;
            });
          });
          setProgress(initialProgress);
        } else {
          setError(response.error || "Failed to load lab");
        }
      } catch (err) {
        console.error("Error fetching lab:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchLab();
  }, [labId]);

  // Get current section and module
  const currentSection = lab?.sections[activeSectionIndex] || null;
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
    } else if (activeSectionIndex < (lab?.sections.length || 0) - 1) {
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
      const prevSection = lab?.sections[activeSectionIndex - 1];
      if (prevSection) {
        setActiveSectionIndex(activeSectionIndex - 1);
        setActiveModuleIndex(prevSection.modules.length - 1);
      }
    }
  };

  const goToSection = (sectionIndex: number) => {
    if (sectionIndex >= 0 && sectionIndex < (lab?.sections.length || 0)) {
      setActiveSectionIndex(sectionIndex);
      setActiveModuleIndex(0);
    }
  };

  const goToModule = (sectionIndex: number, moduleIndex: number) => {
    if (
      sectionIndex >= 0 && 
      sectionIndex < (lab?.sections.length || 0) && 
      moduleIndex >= 0 && 
      moduleIndex < (lab?.sections[sectionIndex].modules.length || 0)
    ) {
      setActiveSectionIndex(sectionIndex);
      setActiveModuleIndex(moduleIndex);
    }
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  // Calculate overall progress
  const calculateProgress = () => {
    if (!lab) return 0;
    
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
  const isLastModule = () => {
    if (!lab) return false;
    return (
      activeSectionIndex === lab.sections.length - 1 &&
      activeModuleIndex === (currentSection?.modules.length || 0) - 1
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground">Loading Lab...</h2>
          <p className="text-secondary-foreground mt-2">Please wait while we prepare your learning experience.</p>
        </div>
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="max-w-2xl mx-auto bg-card p-8 rounded-xl border border-border-color shadow-lg text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400 mb-6">
            <AlertTriangleIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-red-500 dark:text-red-400 mb-4">Error Loading Lab</h1>
          <p className="mb-6 text-foreground text-lg">{error || "Failed to load the lab content."}</p>
          <Link href="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-lg font-medium hover:opacity-90 transition-opacity inline-flex items-center">
            <HomeIcon className="mr-2" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header with lab information */}
      <header className="sticky top-0 z-10 bg-card border-b border-border-color shadow-sm">
        <div className="px-4 md:px-6 py-4 container mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleSidebar}
                  className="p-2 rounded-md hover:bg-secondary"
                  aria-label={sidebarExpanded ? "Collapse sections" : "Expand sections"}
                >
                  <MenuIcon className="w-5 h-5" />
                </button>
                <Link href="/" className="text-xl font-bold text-primary">
                  One Click Labs
                </Link>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground mt-1 md:mt-2">
                {lab.title}
              </h1>
            </div>
            
            <div>
              <div className="flex items-center gap-3">
                {/* Progress indicator */}
                <div className="hidden sm:block">
                  <div className="flex items-center gap-2">
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
                </div>
                
                {/* Add the export button */}
                {lab && <ExportLabButton lab={lab} variant="outline" />}
                
                <Link 
                  href={`/edit-lab/${lab.id}`}
                  className="px-3 py-1.5 border border-border-color rounded-md text-sm hover:bg-secondary transition-colors hidden sm:inline-flex items-center"
                >
                  <EditIcon className="mr-1.5 h-4 w-4" />
                  Edit Lab
                </Link>
                
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with sections */}
        <div className={`${sidebarExpanded ? 'w-72' : 'w-0 sm:w-16'} flex-shrink-0 bg-card transition-all duration-300 border-r border-border-color flex flex-col h-full`}>
          {sidebarExpanded ? (
            <div className="flex flex-col h-full">
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
                      onClick={() => goToSection(sectionIdx)}
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
              
              {/* Footer with lab info */}
              <div className="mt-auto p-4 border-t border-border-color text-xs text-secondary-foreground">
                {lab.isPublished && (
                  <p className="flex items-center mb-1">
                    <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500 dark:text-green-400" />
                    <span>Published {lab.publishedAt && formatDistanceToNow(new Date(lab.publishedAt))} ago</span>
                  </p>
                )}
                {lab.author?.name && (
                  <p>Created by <span className="text-foreground">{lab.author.name}</span></p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 h-full">
              {/* Collapsed sidebar - just show icons */}
              <button 
                onClick={toggleSidebar}
                className="p-2 rounded-full hover:bg-secondary mb-4"
                aria-label="Expand sidebar"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              
              <div className="flex-1 w-full space-y-2 px-2">
                {lab.sections.map((section, sectionIdx) => (
                  <button
                    key={section.id}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activeSectionIndex === sectionIdx 
                        ? "bg-primary/20 text-primary" 
                        : "hover:bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => goToSection(sectionIdx)}
                    title={section.title}
                  >
                    <span className="font-medium">{sectionIdx + 1}</span>
                  </button>
                ))}
              </div>
              
              {/* Mini progress indicator */}
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mt-4" title={`${Math.round(calculateProgress())}% complete`}>
                <div 
                  className="w-8 h-8 rounded-full border-4 border-primary"
                  style={{ 
                    background: `conic-gradient(var(--primary) ${calculateProgress() * 3.6}deg, transparent 0deg)` 
                  }}
                ></div>
              </div>
            </div>
          )}
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
                      <span>Section {activeSectionIndex + 1}</span>
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
                  This lab has no modules. Please select a different lab or contact the lab creator.
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
function MenuIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
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

function AlertTriangleIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}

function HomeIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}

function EditIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
}

function CheckIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
