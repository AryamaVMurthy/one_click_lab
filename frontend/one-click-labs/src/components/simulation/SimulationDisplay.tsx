"use client";

import React, { useRef, useEffect } from 'react';

interface SimulationDisplayProps {
  htmlContent: string | null;
}

const SimulationDisplay: React.FC<SimulationDisplayProps> = ({ htmlContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!htmlContent || !containerRef.current) return;
    
    // Set the HTML content
    containerRef.current.innerHTML = htmlContent;
    
    // Execute scripts in the HTML content
    const scripts = containerRef.current.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      
      // Copy all attributes from the old script to the new one
      Array.from(oldScript.attributes).forEach(attr => 
        newScript.setAttribute(attr.name, attr.value)
      );
      
      // Copy the script content
      newScript.textContent = oldScript.textContent;
      
      // Replace the old script with the new one to execute it
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });
  }, [htmlContent]);

  if (!htmlContent) {
    return <div className="flex items-center justify-center h-64 bg-slate-100 rounded-md">
      <p className="text-gray-500">No simulation content to display</p>
    </div>;
  }

  return (
    <div className="simulation-container border rounded-md overflow-hidden bg-white">
      <div 
        ref={containerRef} 
        className="simulation-content w-full"
      ></div>
    </div>
  );
};

export default SimulationDisplay;
