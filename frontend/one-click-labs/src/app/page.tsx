"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { Lab } from '@/types/models';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatDistanceToNow as formatDateDistance } from '@/utils/date';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getLabs, deleteLab } from '@/api/apiClient';
import { LabListItem } from '@/types/api';

// Sample labs data (fallback in case API fails)
const sampleLabs: Lab[] = [
  {
    id: "1",
    title: "Introduction to React Hooks",
    description: "Learn how to use React Hooks to manage state and side effects in functional components.",
    status: "published",
    isPublished: true,
    publishedAt: "2023-11-15T10:30:00Z",
    sections: [],
    userId: "user1",
    createdAt: "2023-10-15T10:30:00Z",
    updatedAt: "2023-11-15T10:30:00Z",
  },
  {
    id: "2",
    title: "Build a REST API with Node.js",
    description: "Step-by-step guide to building a RESTful API using Node.js, Express, and MongoDB.",
    status: "draft",
    isPublished: false,
    sections: [],
    userId: "user1",
    createdAt: "2023-12-01T14:45:00Z",
    updatedAt: "2023-12-05T16:20:00Z",
  },
  {
    id: "3",
    title: "Next.js 14 Fundamentals",
    description: "Explore the latest features of Next.js 14 including the App Router, Server Components, and more.",
    status: "draft",
    isPublished: false,
    sections: [],
    userId: "user1",
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-12T11:40:00Z",
  },
  {
    id: "4",
    title: "TypeScript Advanced Patterns",
    description: "Deep dive into advanced TypeScript patterns including conditional types, mapped types, and utility types.",
    status: "archived",
    isPublished: false,
    sections: [],
    userId: "user1",
    createdAt: "2023-09-05T08:30:00Z",
    updatedAt: "2023-09-10T13:20:00Z",
  }
];

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, token, logout } = useAuth();
  const [labs, setLabs] = useState<LabListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labToDelete, setLabToDelete] = useState<LabListItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, message: "", type: "" });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch labs from API
  useEffect(() => {
    const fetchLabsData = async () => {
      if (isAuthenticated && token) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await getLabs(token, currentPage, pageSize);
          if (response.success && response.data && response.data.labs) {
            setLabs(response.data.labs);
            
            // Update pagination information
            if (response.data.pagination) {
              setTotalPages(response.data.pagination.pages);
              setTotalItems(response.data.pagination.total);
            }
          } else {
            setError(response.error || 'Failed to fetch labs');
            // Keep any sample data if already loaded, otherwise set empty array
            if (labs.length === 0) {
              setLabs([]);
            }
          }
        } catch (err) {
          setError('Error fetching labs. Please try again.');
          // Keep existing data if any, otherwise set empty array
          if (labs.length === 0) {
            setLabs([]);
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchLabsData();
  }, [isAuthenticated, token, currentPage, pageSize, labs.length]);

  // Handle deletion of a lab 
  const handleDeleteConfirm = async () => {
    if (!labToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Check if token exists
      if (!token) {
        setError("You must be logged in to delete a lab");
        setIsDeleting(false);
        setShowDeleteModal(false);
        return;
      }
      
      const response = await deleteLab(token, labToDelete.id);
      
      if (response.success) {
        // Remove from local state
        setLabs(currentLabs => currentLabs.filter(lab => lab.id !== labToDelete.id));
        setShowDeleteModal(false);
        
        // Show success message
        setFeedback({
          show: true,
          message: "Lab deleted successfully",
          type: "success"
        });
        
        // Hide feedback after 3 seconds
        setTimeout(() => {
          setFeedback(prev => ({ ...prev, show: false }));
        }, 3000);
      } else {
        setError(response.error || "Failed to delete lab");
      }
    } catch (err) {
      console.error("Error deleting lab:", err);
      setError("An unexpected error occurred while deleting the lab");
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (lab: LabListItem) => {
    setLabToDelete(lab);
    setShowDeleteModal(true);
  };

  // Get status text and color
  const getLabStatus = (lab: LabListItem): { text: string; color: string } => {
    if (lab.isPublished) {
      return { 
        text: 'published', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      };
    } else {
      return { 
        text: 'draft', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header section */}
      <header className="border-b border-border-color">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* User profile */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary">
                {isAuthenticated && user ? (
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                    alt={user.name} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-secondary-foreground">
                    <UserIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  {isAuthenticated && user ? user.name : 'Guest'}
                </h3>
                <p className="text-xs text-secondary-foreground">
                  {isAuthenticated && user ? user.role || 'User' : 'Not logged in'}
                </p>
              </div>
            </div>
          </div>
          
          {/* App title/logo */}
          <div className="hidden md:block">
            <h1 className="text-2xl md:text-3xl font-bold relative px-3 py-2 select-none group">
              <span className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-300 dark:to-gray-500 opacity-10 rounded transform -skew-x-6"></span>
              <span className="relative inline-block font-playfair italic tracking-wide hover:scale-105 transition-all duration-300 ease-in-out">
                <span className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent text-shadow-sm">One</span>
                <span className="text-gray-500 dark:text-gray-400 mx-2 text-shadow-sm">Click</span>
                <span className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 dark:from-gray-300 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent text-shadow-sm">Labs</span>
                <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-600 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
              </span>
              <span className="absolute -bottom-px left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-600 to-transparent"></span>
            </h1>
          </div>
          
          {/* Navigation items */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-hover-color transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            
            {/* Logout button */}
            {isAuthenticated && (
              <button
                onClick={() => logout()}
                className="flex items-center space-x-1 px-3 py-2 rounded-md bg-card border border-border-color hover:bg-hover-color text-text-color transition-colors"
                aria-label="Logout"
              >
                <LogoutIcon className="h-4 w-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Labs</h1>
            <p className="text-secondary-foreground mt-1">Manage your interactive lab experiments</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/create-lab"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center"
            >
              <PlusIcon className="mr-1 h-5 w-5" />
              Create Lab
            </Link>
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard 
            title="Published Labs" 
            value={isLoading ? 0 : labs.filter(lab => lab.isPublished).length} 
            icon={<CheckCircleIcon className="text-green-500" />} 
          />
          <StatCard 
            title="Draft Labs" 
            value={isLoading ? 0 : labs.filter(lab => !lab.isPublished).length} 
            icon={<EditIcon className="text-yellow-500" />} 
          />
          <StatCard 
            title="Total Labs" 
            value={isLoading ? 0 : labs.length} 
            icon={<LabIcon className="text-primary" />} 
          />
        </div>

        {/* Filter/Search section (placeholder) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search labs..." 
              className="pl-10 pr-4 py-2 w-full border border-border-color rounded-md bg-background text-foreground"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-foreground" />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="bg-background border border-border-color rounded-md px-2 py-1 text-sm">
              <option value="all">All Labs</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
            <button className="px-4 py-2 border border-border-color rounded-md bg-background text-foreground">
              <FilterIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Labs grid */}
        {isLoading ? (
          <div className="text-center py-12 bg-card border border-dashed border-border-color rounded-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <LabIcon className="h-8 w-8 text-secondary-foreground" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">Loading labs...</h2>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card border border-dashed border-border-color rounded-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <LabIcon className="h-8 w-8 text-secondary-foreground" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">Error loading labs</h2>
            <p className="text-secondary-foreground mb-6">{error}</p>
          </div>
        ) : labs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map(lab => (
              <LabCard 
                key={lab.id} 
                lab={lab} 
                onDelete={() => openDeleteModal(lab)} 
                statusColor={getLabStatus(lab).color}
                statusText={getLabStatus(lab).text.charAt(0).toUpperCase() + getLabStatus(lab).text.slice(1)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-dashed border-border-color rounded-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <LabIcon className="h-8 w-8 text-secondary-foreground" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">No labs found</h2>
            <p className="text-secondary-foreground mb-6">Get started by creating your first lab</p>
            
            {/* Empty state Create Lab button - ENHANCED */}
            <Link 
              href="/create-lab" 
              className="bg-primary text-primary-foreground px-8 py-3 text-lg font-medium rounded-md hover:opacity-95 hover:shadow-lg hover:translate-y-[-1px] shadow-md transition-all duration-200 inline-flex items-center justify-center border-2 border-primary/20"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Create New Lab
            </Link>
          </div>
        )}
        
        {/* Pagination controls */}
        {!isLoading && labs.length > 0 && (
          <div className="flex justify-between items-center mt-8 pb-6">
            <div className="text-sm text-secondary-foreground">
              Showing {Math.min(pageSize, labs.length)} of {totalItems} labs
            </div>
            <div className="flex space-x-2">
              <select 
                className="bg-background border border-input rounded-md px-2 py-1 text-sm"
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              
              <button 
                className="px-3 py-1 rounded-md border border-input bg-background disabled:opacity-50"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                aria-label="Previous page"
              >
                &larr;
              </button>
              
              <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md">
                {currentPage} of {totalPages || 1}
              </span>
              
              <button 
                className="px-3 py-1 rounded-md border border-input bg-background disabled:opacity-50"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                aria-label="Next page"
              >
                &rarr;
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Lab?"
        message={`Are you sure you want to delete "${labToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDanger
      />
    </div>
  );
}

// Lab Card Component
interface LabCardProps {
  lab: LabListItem;
  onDelete: () => void;
  statusColor: string;
  statusText?: string;
}

function LabCard({ lab, onDelete, statusColor, statusText }: LabCardProps) {
  // Truncate description
  const truncateDescription = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="bg-card border border-border-color rounded-lg overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg text-foreground mb-2">{lab.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
            {statusText || (lab.isPublished ? 'Published' : 'Draft')}
          </span>
        </div>
        
        <p className="text-secondary-foreground text-sm mb-4">
          {truncateDescription(lab.description || 'No description provided')}
        </p>
        
        <div className="flex justify-between items-center border-t border-border-color pt-4">
          <span className="text-xs text-secondary-foreground">
            Updated {formatDateDistance(new Date(lab.updatedAt))} ago
          </span>
          
          <div className="flex space-x-2">
            <Link href={`/edit-lab/${lab.id}`} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
              <EditIcon />
              <span className="sr-only">Edit</span>
            </Link>
            <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
              <TrashIcon />
              <span className="sr-only">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-card border border-border-color rounded-lg p-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-secondary-foreground">{title}</h3>
        <div className="h-10 w-10 rounded-full bg-secondary/30 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// Icons
function PlusIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14M12 5v14M5 12h14"/></svg>;
}

function EditIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}

function TrashIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8.5 2h7"/><path d="M7 16h10"/></svg>;
}

function CheckCircleIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}

function BellIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}

function SettingsIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}

function SearchIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}

function FilterIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
}

function LabIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v8L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14 10V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>;
}

function SunIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}

function MoonIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}

function UserIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

function LogoutIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
}
