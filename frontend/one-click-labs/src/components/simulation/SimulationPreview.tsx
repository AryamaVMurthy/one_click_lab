'use client';

import React, { useRef, useState } from 'react';

interface SimulationPreviewProps {
  html: string;
  isLoading: boolean;
  error?: string;
  cssContent?: string; // Keep for compatibility
  jsContent?: string;  // Keep for compatibility
}

const SimulationPreview: React.FC<SimulationPreviewProps> = ({
  html,
  isLoading,
  error,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!iframeRef.current) return;

    if (!isFullscreen) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full p-4">
        <div className="w-full h-full bg-gray-50 rounded-lg shadow-lg p-4 flex items-center justify-center">
          <p className="text-gray-600">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full p-4">
        <div className="w-full h-full bg-red-50 rounded-lg shadow-lg p-4 flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="w-full h-full p-4">
        <div className="w-full h-full bg-gray-50 rounded-lg shadow-lg p-4 flex items-center justify-center">
          <p className="text-gray-600">No simulation content available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 relative">
      <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={toggleFullscreen}
          className="absolute right-4 top-4 z-10 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors text-gray-700"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title="Simulation Preview"
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default SimulationPreview;
