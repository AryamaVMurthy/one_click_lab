'use client';

import React, { useState, useRef } from 'react';

interface SimulationCodeViewerProps {
  htmlContent: string;
  cssContent?: string; // Keep for compatibility
  jsContent?: string;  // Keep for compatibility
}

const SimulationCodeViewer: React.FC<SimulationCodeViewerProps> = ({
  htmlContent,
  // cssContent and jsContent params not used
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  // Function to handle copying code to clipboard
  const handleCopyCode = () => {
    if (!htmlContent) return;
    
    navigator.clipboard.writeText(htmlContent).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-lg overflow-hidden">
      {/* Header with Copy button */}
      <div className="flex justify-between items-center p-4 border-b border-border-color bg-card">
        <h2 className="text-lg font-bold">Simulation Code</h2>
        <button 
          onClick={handleCopyCode}
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          disabled={!htmlContent}
        >
          {isCopied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>

      {/* Code Display - Single section showing complete HTML */}
      <div className="flex-1 overflow-auto">
        <pre 
          ref={codeRef} 
          className="p-4 text-sm font-mono whitespace-pre-wrap"
        >
          {/* Complete HTML Section */}
          <div>
            <div className="bg-primary/10 px-2 py-1 rounded-t-md font-semibold text-sm">
              Complete HTML
            </div>
            <code className="block p-2 pb-4 bg-background/50 rounded-b-md border border-border-color overflow-x-auto">
              {htmlContent || '<!-- No HTML content available -->'}
            </code>
          </div>
        </pre>
      </div>
    </div>
  );
};

export default SimulationCodeViewer;
