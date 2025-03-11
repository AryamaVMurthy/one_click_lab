"use client";

import React, { useState, useRef, useEffect } from 'react';
import SimulationDisplay from './SimulationDisplay';
import { useTheme } from '@/context/ThemeContext';

interface SimulationCreatorProps {
  initialHtml?: string;
  initialJson?: any;
  onHtmlGenerated: (html: string, json?: any) => void;
  editorMode?: boolean;
}

export default function SimulationCreator({ 
  initialHtml = '',
  initialJson = null,
  onHtmlGenerated,
  editorMode = false
}: SimulationCreatorProps) {
  const { theme } = useTheme();
  const [html, setHtml] = useState(initialHtml);
  const [json, setJson] = useState(initialJson);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [currentTab, setCurrentTab] = useState<'html' | 'json' | 'preview'>('preview');
  const [error, setError] = useState<string | null>(null);
  
  // Call the parent's callback when HTML or JSON changes
  useEffect(() => {
    if (html) {
      onHtmlGenerated(html, json);
    }
  }, [html, json, onHtmlGenerated]);

  // Function to update HTML editor content
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtml(e.target.value);
  };

  // Function to update JSON editor content
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      if (e.target.value.trim()) {
        const parsedJson = JSON.parse(e.target.value);
        setJson(parsedJson);
        setError(null);
      } else {
        setJson(null);
        setError(null);
      }
    } catch (err) {
      setError("Invalid JSON format");
    }
  };
  
  // Function to generate simulation using the backend API
  const generateSimulation = async () => {
    if (!userPrompt.trim()) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      // Add user message to chat history
      const updatedChatHistory = [
        ...chatHistory, 
        { role: 'user', content: userPrompt }
      ];
      setChatHistory(updatedChatHistory);
      
      // Make API request to backend
      const response = await fetch('/api/v1/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userPrompt,
          agent: 'both',
          json_state: json,
          html_memory: html,
          chat_memory: updatedChatHistory
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate simulation');
      }
      
      const data = await response.json();
      
      // Update the simulation content
      if (data.html) {
        setHtml(data.html);
      }
      
      if (data.json) {
        setJson(data.json);
      }
      
      // Add AI response to chat history
      setChatHistory([
        ...updatedChatHistory,
        { role: 'assistant', content: 'Generated simulation based on your request.' }
      ]);
      
      // Switch to preview tab
      setCurrentTab('preview');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the simulation');
    } finally {
      setIsGenerating(false);
      setUserPrompt('');
    }
  };

  return (
    <div className="simulation-creator w-full h-full flex flex-col">
      {/* Main content area with tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab navigation */}
        <div className="flex border-b border-border-color">
          <button
            className={`px-4 py-2 ${currentTab === 'preview' ? 'border-b-2 border-primary font-medium text-primary' : 'text-secondary-foreground'}`}
            onClick={() => setCurrentTab('preview')}
          >
            Preview
          </button>
          <button
            className={`px-4 py-2 ${currentTab === 'html' ? 'border-b-2 border-primary font-medium text-primary' : 'text-secondary-foreground'}`}
            onClick={() => setCurrentTab('html')}
          >
            HTML
          </button>
          <button
            className={`px-4 py-2 ${currentTab === 'json' ? 'border-b-2 border-primary font-medium text-primary' : 'text-secondary-foreground'}`}
            onClick={() => setCurrentTab('json')}
          >
            JSON
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {currentTab === 'preview' && (
            <div className="h-full overflow-auto p-4">
              <SimulationDisplay htmlContent={html} />
            </div>
          )}
          
          {currentTab === 'html' && (
            <div className="h-full p-4">
              <textarea
                value={html}
                onChange={handleHtmlChange}
                className="w-full h-full p-4 font-mono text-sm bg-card border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter HTML code here..."
              />
            </div>
          )}
          
          {currentTab === 'json' && (
            <div className="h-full p-4">
              <textarea
                value={json ? JSON.stringify(json, null, 2) : ''}
                onChange={handleJsonChange}
                className={`w-full h-full p-4 font-mono text-sm bg-card border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${error ? 'border-red-500' : 'border-border-color'}`}
                placeholder="Enter JSON configuration here..."
              />
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            </div>
          )}
        </div>
      </div>

      {/* AI Generation controls */}
      <div className="p-4 border-t border-border-color bg-card">
        <div className="flex flex-col gap-3">
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            className="w-full p-3 min-h-[100px] border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Describe the simulation you want to create..."
            disabled={isGenerating}
          />
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-secondary-foreground italic">
              {isGenerating ? 'Generating simulation...' : 'Use AI to generate your simulation based on a description'}
            </div>
            
            <button
              onClick={generateSimulation}
              disabled={isGenerating || !userPrompt.trim()}
              className={`px-4 py-2 rounded-md ${
                isGenerating || !userPrompt.trim()
                  ? 'bg-primary/40 cursor-not-allowed text-primary-foreground/70'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              } flex items-center gap-2`}
            >
              {isGenerating ? (
                <>
                  <SpinnerIcon className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  Generate Simulation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3m0 12v3m-9-9H6m12 0h3m-2.5-4.5-2 2m-7-2-2 2m2 7 2-2m7 2 2-2"/>
    </svg>
  );
}

function SpinnerIcon({ className = "" }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
