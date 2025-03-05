"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[]; // Optional roles for authorization
}

/**
 * A wrapper component that protects routes requiring authentication
 * Redirects to login page if user is not authenticated
 */
export default function ProtectedRoute({ children, roles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only check after auth state is loaded
    if (!isLoading) {
      if (!isAuthenticated) {
        // Store the intended destination to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', pathname);
        
        // Redirect to login
        router.push('/login');
      } else if (roles.length > 0 && user) {
        // If roles specified, check if user has required role
        const hasRequiredRole = roles.includes(user.role);
        
        if (!hasRequiredRole) {
          // Redirect to unauthorized page or dashboard
          router.push('/unauthorized');
        }
      }
    }
  }, [isAuthenticated, isLoading, roles, user, router, pathname]);

  // Show loading state when authentication state is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render children if authenticated (and authorized if roles specified)
  if (isAuthenticated && (!roles.length || (user && roles.includes(user.role)))) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
