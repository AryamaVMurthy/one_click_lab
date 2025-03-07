"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getLab, updateLab, deployLab } from "@/api/apiClient";
import { 
  Lab, 
  Module, 
  Section, 
  createSection, 
  isTextModule, 
  isQuizModule,
  TextModule,
  QuizModule
} from "@/types/models";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import DeployConfirmationModal from "@/components/DeployConfirmationModal";
import SectionEditor from "@/components/SectionEditor";
import { createPortal } from "react-dom";
import ExportLabButton from "@/components/ExportLabButton";
import LabPreview from "@/components/LabPreview";

export default function EditLabPage() {
  const { theme } = useTheme();
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const labId = params.id as string;
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Lab state
  const [lab, setLab] = useState<Lab | null>(null);
  const [originalLab, setOriginalLab] = useState<Lab | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<{ url: string; version: string } | null>(null);
  const [saveFeedback, setSaveFeedback] = useState({ show: false, message: "", isError: false });
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);
  const [showLabDetailsModal, setShowLabDetailsModal] = useState(false);
  const [showModulePreview, setShowModulePreview] = useState(false);
  const [showSectionsList, setShowSectionsList] = useState(false);
  const [showFullLabPreview, setShowFullLabPreview] = useState(false);

  // Load lab data
  useEffect(() => {
    async function fetchLab() {
      try {
        setLoading(true);
        
        // Check if token exists
        if (!token) {
          setError("You must be logged in to edit a lab");
          setLoading(false);
          return;
        }
        
        const response = await getLab(token, labId);
        if (response.success && response.data) {
          const labData = response.data;
          setLab(labData);
          setOriginalLab(JSON.parse(JSON.stringify(labData))); // Deep copy for comparison
          setTitle(labData.title);
          setDescription(labData.description);
          setSections(labData.sections || []);
          // If sections exist, set the first one as active by default
          if (labData.sections && labData.sections.length > 0) {
            setActiveSectionIndex(0);
          }
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
  }, [labId, token]);

  // Check for unsaved changes
  useEffect(() => {
    if (!originalLab) return;
    
    // Use a more reliable way to check for differences without causing infinite loops
    const hasChanges = 
      title !== originalLab.title || 
      description !== originalLab.description ||
      JSON.stringify(sections) !== JSON.stringify(originalLab.sections);
    
    // Only update state if there's an actual change to prevent infinite loops
    if (hasUnsavedChanges !== hasChanges) {
      setHasUnsavedChanges(hasChanges);
    }
    // We use a stable stringified version of sections to prevent infinite rerenders
  }, [title, description, originalLab, hasUnsavedChanges]);

  // Use a new useEffect with fewer dependencies for section changes
  useEffect(() => {
    if (!originalLab) return;
    
    const sectionsChanged = JSON.stringify(sections) !== JSON.stringify(originalLab.sections);
    if (sectionsChanged && !hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  }, [sections, originalLab]);

  // Add a section
  const addSection = () => {
    const newSection = createSection({
      title: "New Section",
      order: sections.length
    });
    const newSections = [...sections, newSection];
    setSections(newSections);
    
    // Automatically select the new section
    setActiveSectionIndex(newSections.length - 1);
    
    // Close sections list if it was open
    setShowSectionsList(false);
  };

  // Update a section
  const updateSection = (updatedSection: Section, index: number) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };

  // Delete a section
  const deleteSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
    
    // If we deleted the active section, handle navigation
    if (activeSectionIndex === index) {
      if (newSections.length > 0) {
        // Select the previous section, or the first one if we deleted the first section
        setActiveSectionIndex(index > 0 ? index - 1 : 0);
      } else {
        // No sections left
        setActiveSectionIndex(null);
      }
    } else if (activeSectionIndex !== null && activeSectionIndex > index) {
      // If we deleted a section before the active one, adjust the index
      setActiveSectionIndex(activeSectionIndex - 1);
    }
  };

  // Navigate between sections
  const navigateToSection = (index: number) => {
    if (index >= 0 && index < sections.length) {
      setActiveSectionIndex(index);
      setShowSectionsList(false); // Close sections list when navigating
      setShowModulePreview(false); // Reset preview mode when changing sections
    }
  };

  // Save lab changes
  const saveLab = async () => {
    if (!lab) return;
    
    // Check if token exists
    if (!token) {
      setSaveFeedback({
        show: true,
        message: "You must be logged in to save changes",
        isError: true
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      const updatedLab: Lab = {
        ...lab,
        title,
        description,
        sections,
        updatedAt: new Date().toISOString()
      };
      
      const response = await updateLab(token, lab.id, updatedLab);
      
      if (response.success && response.data) {
        // Update local state with server response
        setLab(response.data);
        setOriginalLab(JSON.parse(JSON.stringify(response.data)));
        
        // Show success feedback
        setSaveFeedback({
          show: true,
          message: "Lab saved successfully",
          isError: false
        });
        
        // Hide feedback after 3 seconds
        setTimeout(() => {
          setSaveFeedback({ show: false, message: "", isError: false });
        }, 3000);
      } else {
        setSaveFeedback({
          show: true,
          message: response.error || "Failed to save lab",
          isError: true
        });
      }
    } catch (err) {
      console.error("Error saving lab:", err);
      setSaveFeedback({
        show: true,
        message: "An unexpected error occurred",
        isError: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Deploy lab
  const handleDeployLab = async () => {
    if (!lab) return;
    
    // Check if there are unsaved changes first
    if (hasUnsavedChanges) {
      await saveLab();
    }
    
    // Check if token exists
    if (!token) {
      setError("You must be logged in to deploy this lab");
      return;
    }
    
    setIsDeploying(true);
    
    try {
      const response = await deployLab(token, lab.id);
      
      if (response.success && response.data) {
        setDeploySuccess({
          url: response.data.deploymentUrl,
          version: response.data.deployedVersion
        });
        
        // Update lab data to reflect deployed state
        if (lab) {
          setLab({
            ...lab,
            isPublished: true,
            publishedAt: new Date().toISOString(),
            publishedVersion: response.data.deployedVersion
          });
        }
      } else {
        setError(response.error || "Failed to deploy lab");
      }
    } catch (err) {
      console.error("Error deploying lab:", err);
      setError("An unexpected error occurred during deployment");
    } finally {
      setIsDeploying(false);
    }
  };

  // Handle keypress to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar with Alt+S
      if (e.altKey && e.key === 's') {
        setSidebarExpanded(prev => !prev);
      }
      
      // Alt+ArrowLeft to go to previous section
      if (e.altKey && e.key === 'ArrowLeft' && activeSectionIndex !== null) {
        navigateToSection(activeSectionIndex - 1);
      }
      
      // Alt+ArrowRight to go to next section
      if (e.altKey && e.key === 'ArrowRight' && activeSectionIndex !== null) {
        navigateToSection(activeSectionIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSectionIndex, sections.length]);

  // Confirm discard changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // If in full preview mode, render the LabPreview component
  if (showFullLabPreview && lab) {
    return (
      <LabPreview 
        lab={lab} 
        onExitPreview={() => setShowFullLabPreview(false)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading lab...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto bg-card p-6 rounded-lg border border-border-color">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="mb-6 text-foreground">{error}</p>
          <Link href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header with controls */}
      <header className="sticky top-0 z-10 bg-background border-b border-border-color shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="mr-4 p-1 rounded hover:bg-secondary"
              aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              <MenuIcon />
            </button>
            <Link href="/" className="text-2xl font-bold text-primary">
              One Click Labs
            </Link>
            <span className="ml-4 text-lg text-foreground font-medium truncate max-w-xs">
              {title || "Untitled Lab"}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Add Full Lab Preview button */}
            <button
              onClick={() => setShowFullLabPreview(true)}
              className="px-3 py-1.5 rounded-md text-sm font-medium flex items-center border border-primary text-primary hover:bg-primary/10"
              title="Preview full lab as student"
            >
              <ViewIcon className="mr-1.5 h-4 w-4" />
              Preview Lab
            </button>
            
            {/* Section navigation buttons when a section is active */}
            {activeSectionIndex !== null && (
              <div className="flex items-center mr-2 gap-1">
                <button
                  onClick={() => navigateToSection(activeSectionIndex - 1)}
                  disabled={activeSectionIndex <= 0}
                  className={`p-1.5 rounded-md ${
                    activeSectionIndex <= 0
                      ? "text-secondary-foreground/40 cursor-not-allowed"
                      : "hover:bg-secondary text-secondary-foreground"
                  }`}
                  title="Previous section (Alt+←)"
                >
                  <ChevronLeftIcon />
                </button>
                <span className="text-sm text-secondary-foreground px-1">
                  {activeSectionIndex + 1}/{sections.length}
                </span>
                <button
                  onClick={() => navigateToSection(activeSectionIndex + 1)}
                  disabled={activeSectionIndex >= sections.length - 1}
                  className={`p-1.5 rounded-md ${
                    activeSectionIndex >= sections.length - 1
                      ? "text-secondary-foreground/40 cursor-not-allowed"
                      : "hover:bg-secondary text-secondary-foreground"
                  }`}
                  title="Next section (Alt+→)"
                >
                  <ChevronRightIcon />
                </button>
                
                {/* Toggle sections list button */}
                <button
                  onClick={() => setShowSectionsList(!showSectionsList)}
                  className="p-1.5 rounded-md hover:bg-secondary text-secondary-foreground ml-1"
                  title="Show all sections"
                >
                  <ListIcon />
                </button>
              </div>
            )}
            
            {/* Module preview toggle */}
            {activeSectionIndex !== null && (
              <button
                onClick={() => setShowModulePreview(!showModulePreview)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${
                  showModulePreview 
                    ? "bg-secondary text-secondary-foreground" 
                    : "border border-border-color"
                }`}
                title="Toggle between edit and preview mode"
              >
                {showModulePreview ? (
                  <>
                    <EditIcon2 className="mr-1.5 h-4 w-4" /> 
                    <span>Edit Mode</span>
                  </>
                ) : (
                  <>
                    <EyeIcon className="mr-1.5 h-4 w-4" /> 
                    <span>Preview Mode</span>
                  </>
                )}
              </button>
            )}
            
            {/* Save feedback message */}
            {saveFeedback.show && (
              <div key="save-feedback" className={`text-sm py-1 px-3 rounded-full ${
                saveFeedback.isError 
                  ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" 
                  : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              }`}>
                {saveFeedback.message}
              </div>
            )}
            
            {/* Deployment success message */}
            {deploySuccess && (
              <div key="deploy-success" className="text-sm py-1 px-3 rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex gap-2 items-center">
                Deployed! 
                <a 
                  href={deploySuccess.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline text-primary"
                >
                  View Lab
                </a>
              </div>
            )}
            
            {/* Add Export button before Save button */}
            {lab && (
              <ExportLabButton 
                lab={lab} 
                variant="outline" 
                className="hidden md:flex"
              />
            )}
            
            {/* Save button */}
            <button
              onClick={saveLab}
              disabled={!hasUnsavedChanges || isSaving}
              className={`px-4 py-2 rounded-md flex items-center ${
                hasUnsavedChanges && !isSaving
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-secondary text-secondary-foreground/50 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <>
                  <SaveIcon className="mr-2 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2" />
                  <span>Save</span>
                </>
              )}
            </button>
            
            {/* Deploy button */}
            <button
              onClick={() => setShowDeployModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <RocketIcon className="mr-2" />
              Deploy
            </button>
            
            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with lab structure */}
        <div 
          ref={sidebarRef}
          className={`${sidebarExpanded ? 'w-72' : 'w-0'} bg-card border-r border-border-color transition-all duration-300 flex flex-col h-full`}
        >
          {sidebarExpanded && (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border-color">
                <button 
                  onClick={() => setShowLabDetailsModal(true)}
                  className="w-full px-3 py-2 bg-secondary/50 hover:bg-secondary text-foreground rounded-md text-left flex justify-between items-center"
                >
                  <span className="font-medium">Lab Details</span>
                  <EditIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-foreground">Sections</h2>
                  </div>
                  
                  {/* Section list */}
                  <ul className="space-y-2">
                    {sections.length > 0 ? (
                      sections.map((section, index) => (
                        <li key={section.id}>
                          <button
                            onClick={() => navigateToSection(index)}
                            className={`w-full px-3 py-2 rounded-md text-left flex justify-between items-center ${
                              activeSectionIndex === index
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-secondary text-foreground"
                            }`}
                          >
                            <span className="truncate flex-1">
                              {index + 1}. {section.title || "Untitled Section"}
                            </span>
                            <span className="text-xs text-secondary-foreground px-1.5 py-0.5 bg-secondary rounded-full">
                              {section.modules?.length || 0}
                            </span>
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-4 text-center text-secondary-foreground">
                        <p className="mb-2">No sections yet</p>
                      </li>
                    )}
                  </ul>
                  
                  {/* Add Section button - moved to sidebar */}
                  <button 
                    onClick={addSection}
                    className="w-full mt-4 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-md flex items-center justify-center"
                  >
                    <PlusCircleIcon className="mr-2" />
                    Add New Section
                  </button>
                </div>
              </div>
              
              <div className="mt-auto border-t border-border-color p-4">
                <div className="flex items-center text-sm text-secondary-foreground">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    lab?.status === 'published' 
                      ? 'bg-green-500' 
                      : lab?.status === 'draft' 
                        ? 'bg-yellow-500' 
                        : 'bg-gray-500'
                  }`} />
                  <span className="capitalize">{lab?.status || 'Draft'}</span>
                  
                  <span className="mx-2">•</span>
                  
                  <span>Last saved: {lab?.updatedAt 
                    ? new Date(lab.updatedAt).toLocaleTimeString() 
                    : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {activeSectionIndex !== null ? (
              // Show active section in main area - removed max-w-4xl constraint
              <div className="w-full">
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      Section {activeSectionIndex + 1}: {sections[activeSectionIndex]?.title || "Untitled Section"}
                    </h1>
                    <p className="text-secondary-foreground text-sm mt-1">
                      {sections[activeSectionIndex]?.modules?.length 
                        ? `${sections[activeSectionIndex].modules.length} modules` 
                        : 'No modules'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Module preview toggle */}
                    <button
                      onClick={() => setShowModulePreview(!showModulePreview)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${
                        showModulePreview 
                          ? "bg-secondary text-secondary-foreground" 
                          : "border border-border-color"
                      }`}
                      title="Toggle between edit and preview mode"
                    >
                      {showModulePreview ? (
                        <>
                          <EditIcon2 className="mr-1.5 h-4 w-4" /> 
                          <span>Edit Mode</span>
                        </>
                      ) : (
                        <>
                          <EyeIcon className="mr-1.5 h-4 w-4" /> 
                          <span>Preview Mode</span>
                        </>
                      )}
                    </button>
                    
                    {/* Section menu dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSectionsList(!showSectionsList)}
                        className="p-2 rounded-md hover:bg-secondary"
                        aria-label="Section options"
                      >
                        <DotsVerticalIcon />
                      </button>
                      
                      {showSectionsList && (
                        <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-card border border-border-color overflow-hidden z-10">
                          <div className="py-1">
                            <button
                              key="delete-section"
                              onClick={() => deleteSection(activeSectionIndex)}
                              className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-100/30 dark:hover:bg-red-900/20 flex items-center"
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete Section
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6 bg-card border border-border-color rounded-lg shadow-sm overflow-hidden">
                  {/* Section content */}
                  {showModulePreview ? (
                    // Preview mode for modules
                    <div className="prose prose-sm dark:prose-invert max-w-none p-6">
                      <h2 className="text-xl font-semibold mb-4">{sections[activeSectionIndex]?.title}</h2>
                      {sections[activeSectionIndex]?.modules.length > 0 ? (
                        sections[activeSectionIndex].modules.map((module, idx) => (
                          <div key={module.id} className="mb-8">
                            <h3 className="text-lg font-medium mb-2">{module.title || `Module ${idx + 1}`}</h3>
                            {isTextModule(module) && (
                              <div dangerouslySetInnerHTML={{ __html: module.content }} className="video-responsive" />
                            )}
                            {isQuizModule(module) && (
                              <div className="border-l-4 border-primary pl-4 italic">
                                <p>Quiz with {module.questions.length} questions</p>
                                <p className="text-secondary-foreground text-sm">(Quiz content appears in interactive mode)</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-secondary-foreground italic">This section has no content yet. Switch to Edit Mode to add modules.</p>
                      )}
                    </div>
                  ) : (
                    // Edit mode with section editor - removed the key that was causing re-renders
                    <SectionEditor
                      section={sections[activeSectionIndex]}
                      onChange={(updatedSection) => updateSection(updatedSection, activeSectionIndex)}
                      onDelete={() => deleteSection(activeSectionIndex)}
                    />
                  )}
                </div>

                {/* Section navigation */}
                <div className="mb-6 flex items-center justify-between">
                  <button
                    onClick={() => navigateToSection(activeSectionIndex - 1)}
                    disabled={activeSectionIndex <= 0}
                    className={`px-4 py-2 rounded-md border flex items-center ${
                      activeSectionIndex <= 0
                        ? "border-border-color text-secondary-foreground/40 cursor-not-allowed"
                        : "border-border-color hover:bg-secondary text-foreground"
                    }`}
                  >
                    <ChevronLeftIcon className="mr-2" />
                    Previous Section
                  </button>
                  <button
                    onClick={() => navigateToSection(activeSectionIndex + 1)}
                    disabled={activeSectionIndex >= sections.length - 1}
                    className={`px-4 py-2 rounded-md border flex items-center ${
                      activeSectionIndex >= sections.length - 1
                        ? "border-border-color text-secondary-foreground/40 cursor-not-allowed"
                        : "border-border-color hover:bg-secondary text-foreground"
                    }`}
                  >
                    Next Section
                    <ChevronRightIcon className="ml-2" />
                  </button>
                </div>

                {/* Keyboard shortcuts reminder */}
                <div className="text-xs text-secondary-foreground text-center mb-4 p-2 bg-secondary/30 rounded-md">
                  <p><span className="font-medium">Keyboard shortcuts:</span> Alt+← Previous section | Alt+→ Next section | Alt+S Toggle sidebar</p>
                </div>
              </div>
            ) : (
              // No sections or no active section selected - also removed max-w-4xl
              <div className="w-full">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                  <p className="text-secondary-foreground mt-1">{description}</p>
                </div>
                
                <div className="text-center py-16 bg-card border border-dashed border-border-color rounded-lg">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                    <LabIcon className="h-8 w-8 text-secondary-foreground" />
                  </div>
                  <h2 className="text-xl font-medium text-foreground mb-2">
                    {sections.length > 0 ? 'Select a section to start editing' : 'No sections yet'}
                  </h2>
                  <p className="text-secondary-foreground mb-6 max-w-md mx-auto">
                    {sections.length > 0 
                      ? 'Click on a section from the sidebar to begin editing.'
                      : 'Start building your lab by adding your first section. Each section can contain text modules and quizzes.'}
                  </p>
                  <button
                    onClick={addSection}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors"
                  >
                    Add First Section
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Lab Details Modal */}
      {showLabDetailsModal && createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card rounded-lg shadow-xl border border-border-color p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Lab Details</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="modal-lab-title" className="block text-sm font-medium mb-1 text-foreground">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-lab-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border-color rounded-md bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="modal-lab-description" className="block text-sm font-medium mb-1 text-foreground">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="modal-lab-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-border-color rounded-md bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowLabDetailsModal(false)}
                  className="px-4 py-2 border border-border-color rounded-md hover:bg-secondary transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    saveLab();
                    setShowLabDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Deploy confirmation modal */}
      <DeployConfirmationModal
        key="deploy-confirmation-modal"
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
        onDeploy={handleDeployLab}
        title="Deploy Lab"
        message={
          lab?.isPublished
            ? "This will update the published version of your lab with your latest changes. Are you sure you want to continue?"
            : "This will make your lab publicly accessible. Are you sure you want to publish this lab?"
        }
        isDeploying={isDeploying}
      />
    </div>
  );
}

// Icons
function SaveIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
  );
}

function RocketIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14"/><path d="M5 12h14"/></svg>
  );
}

function PlusCircleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
  );
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
  );
}

function EditIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}

function ChevronLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 18 9 12 15 6"/></svg>
  );
}

function ChevronRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 18 15 12 9 6"/></svg>
  );
}

function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}

function EditIcon2({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.83 2.83 0 0 1 2.83 2.83L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
  );
}

function ListIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
  );
}

function XCircleIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>
  );
}

function LabIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 2v8L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14 10V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>
  );
}

function DotsVerticalIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="18" r="2"/></svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
  );
}

function ViewIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
