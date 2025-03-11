"use client";

import React, { useRef } from 'react';

interface SimulationDisplayProps {
  htmlContent: string | null;
  className?: string;
  fullHeight?: boolean;
}

const SimulationDisplay: React.FC<SimulationDisplayProps> = ({ 
  htmlContent, 
  className = '',
  fullHeight = false 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  if (!htmlContent) {
    return <div className={`flex items-center justify-center h-64 bg-slate-100 rounded-md ${className}`}>
      <p className="text-gray-500">No simulation content to display</p>
    </div>;
  }
  
  return (
    <div className={`simulation-container ${className} ${fullHeight ? 'h-full' : ''}`}>
      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        title="Simulation"
        className="w-full border-none"
        style={{ 
          height: fullHeight ? '100%' : '500px',
          backgroundColor: 'white' 
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default SimulationDisplay;
