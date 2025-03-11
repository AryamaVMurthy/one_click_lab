"use client";

import React, { useRef, useEffect } from 'react';

interface SimulationDisplayProps {
  htmlContent: string;
  fullscreenMode?: boolean;
  className?: string;
}

export default function SimulationDisplay({ 
  htmlContent, 
  fullscreenMode = false,
  className = ''
}: SimulationDisplayProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    // Any setup needed for the iframe when content changes
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      // You could add message listeners here if needed
      // window.addEventListener('message', handleMessage);
    }
    
    return () => {
      // Cleanup if needed
      // window.removeEventListener('message', handleMessage);
    };
  }, [htmlContent]);
  
  if (!htmlContent) {
    return (
      <div className={`w-full h-64 flex items-center justify-center bg-secondary/20 text-secondary-foreground border border-border-color rounded-lg ${className}`}>
        <p>No simulation content available.</p>
      </div>
    );
  }
  
  return (
    <div className={`simulation-display w-full ${fullscreenMode ? 'h-full' : ''} ${className}`}>
      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        title="Simulation Preview"
        className="w-full h-full border-none rounded-lg bg-white"
        style={{ 
          minHeight: fullscreenMode ? '100%' : '500px',
        }}
        sandbox="allow-scripts"
      />
    </div>
  );
}
