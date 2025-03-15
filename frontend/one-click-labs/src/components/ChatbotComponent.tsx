"use client";

import React, { useState, useRef, useEffect } from "react";
import { Lab } from "@/types/models";
import { 
  processChatMessage,
  processEditCommand,
  toggleMode,
  pdfToText,
  processReferenceText,
  clearSession,
  handleUserPrompt
} from "@/api/aiApiClient";
import { getLab, updateLab } from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import {
  AIResponse,
  ReferenceTextResponse,
  PDFToTextResponse
} from "@/types/aiTypes";

interface ChatbotComponentProps {
  lab: Lab;
  onLabUpdate: (updatedLab: Lab) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotComponent({ lab, onLabUpdate }: ChatbotComponentProps) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'chat' | 'edit'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [processingText, setProcessingText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { 
          role: 'assistant', 
          content: `Hello! I'm your Virtual Lab Assistant. How may I help you today? ${chatMode === 'chat' ? 
            "Ask me questions about your lab or switch to edit mode to modify your lab content." : 
            "Tell me what changes you'd like to make to your lab."}`
        }
      ]);
    }
  }, [isOpen, messages.length, chatMode]);

  // Toggle chatbot visibility
  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  // Handle mode toggle
  const handleToggleMode = async () => {
    try {
      setIsLoading(true);
      const newMode = chatMode === 'chat' ? 'edit' : 'chat';
      const response = await toggleMode(lab, newMode, sessionId);
      setSessionId(response.session_id);
      setChatMode(newMode);
      addMessage('assistant', response.response);
    } catch (error) {
      console.error('Error toggling mode:', error);
      addMessage('assistant', 'Sorry, there was an error switching modes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add message to chat
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  // Handle PDF upload
  const handlePdfUpload = async () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  // Process uploaded PDF
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPdf(true);
      addMessage('user', `Uploading PDF: ${file.name}`);

      // Convert PDF to text
      const result = await pdfToText(file);
      addMessage('assistant', `PDF uploaded successfully. Processing content of ${result.filename}...`);

      // Process the extracted text
      setProcessingText(true);
      const textResponse = await processReferenceText(result.text, sessionId);
      // Keep using the same session ID since the backend doesn't return a new one
      // in the ReferenceTextResponse
      
      addMessage('assistant', textResponse.message);
    } catch (error) {
      console.error('Error processing PDF:', error);
      addMessage('assistant', 'Sorry, there was an error processing your PDF. Please try again.');
    } finally {
      setUploadingPdf(false);
      setProcessingText(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput('');
    addMessage('user', userInput);
    setIsLoading(true);

    try {
      let response: AIResponse;

      // Use handleUserPrompt which will automatically determine the right mode
      response = await handleUserPrompt(lab, userInput, chatMode, sessionId);
      
      // Update session ID
      setSessionId(response.session_id);
      
      // If the mode has changed, update our local mode state
      if (response.mode !== chatMode) {
        setChatMode(response.mode);
      }
      
      // Add assistant's response to chat
      addMessage('assistant', response.response);
      
      // If we're in edit mode and lab JSON was updated, reload the lab using the same flow as initial page load
      if (response.mode === 'edit' && response.lab_json && JSON.stringify(response.lab_json) !== JSON.stringify(lab)) {
        try {
          // First save the AI's changes to MongoDB
          const saveResponse = await updateLab(token!, lab.id, response.lab_json);
          
          if (saveResponse.success && saveResponse.data) {
            // Then reload the lab using getLab to ensure consistent state
            const reloadResponse = await getLab(token!, lab.id);
            
            if (reloadResponse.success && reloadResponse.data) {
              // Pass the reloaded lab data to parent component
              onLabUpdate(reloadResponse.data);
              addMessage('assistant', 'Changes have been saved successfully.');
            } else {
              throw new Error(reloadResponse.error || 'Failed to reload lab data');
            }
          } else {
            throw new Error(saveResponse.error || 'Failed to save changes');
          }
        } catch (error) {
          console.error('Error saving/reloading lab:', error);
          addMessage('assistant', 'There was an error saving the changes. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('assistant', 'Sorry, there was an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat history
  const handleClearChat = async () => {
    if (sessionId) {
      try {
        await clearSession(sessionId);
        setMessages([]);
        setSessionId(undefined);
      } catch (error) {
        console.error('Error clearing session:', error);
        addMessage('assistant', 'Sorry, there was an error clearing the chat history. Please try again.');
      }
    } else {
      // Just clear local chat history if no session ID
      setMessages([]);
    }
  };

  return (
    <>
      {/* Floating button to open chatbot */}
      <button
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:opacity-90 transition-all z-50"
        aria-label="Open AI Assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 9h8M8 15h4" />
        </svg>
      </button>

      {/* Chatbot interface */}
      <div 
        className={`fixed bottom-6 right-6 w-96 h-[600px] bg-card border border-border-color rounded-lg shadow-lg z-50 transition-all transform ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        } flex flex-col overflow-hidden`}
      >
        {/* Chat header */}
        <div className="bg-primary p-3 text-primary-foreground flex justify-between items-center">
          <h3 className="font-medium">Virtual Lab Assistant</h3>

          <div className="flex gap-1">
            {/* Mode toggle */}
            <button
              onClick={handleToggleMode}
              disabled={isLoading}
              className={`px-2 py-1 text-xs rounded-md ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                chatMode === 'chat' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {chatMode === 'chat' ? 'Chat Mode' : 'Edit Mode'}
            </button>
            
            {/* Clear chat button */}
            <button
              onClick={handleClearChat}
              className="p-1 hover:bg-primary-dark rounded"
              title="Clear chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
            
            {/* Close button */}
            <button
              onClick={toggleChatbot}
              className="p-1 hover:bg-primary-dark rounded"
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 p-4 overflow-y-auto bg-background"
        >
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div 
                className={`inline-block p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-secondary text-secondary-foreground rounded-tl-none'
                }`}
              >
                {message.content.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < message.content.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-left mb-4">
              <div className="inline-block p-3 rounded-lg bg-secondary text-secondary-foreground rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-secondary-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-secondary-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-secondary-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border-color p-3 bg-card">
          {/* PDF upload button */}
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={handlePdfUpload}
              disabled={uploadingPdf || processingText}
              className={`px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors flex items-center ${
                (uploadingPdf || processingText) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploadingPdf || processingText ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-secondary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {uploadingPdf ? 'Uploading...' : 'Processing...'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  Upload PDF
                </>
              )}
            </button>
            <span className="text-xs text-secondary-foreground">
              {chatMode === 'chat' ? 'Ask questions about your lab' : 'Describe changes to your lab'}
            </span>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
            disabled={uploadingPdf || processingText}
          />

          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chatMode === 'chat' ? "Ask a question..." : "Describe lab changes..."}
              className="flex-1 px-3 py-2 bg-background border border-border-color rounded-md focus:ring-1 focus:ring-primary focus:border-primary resize-none"
              rows={2}
              disabled={isLoading || uploadingPdf || processingText}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || uploadingPdf || processingText}
              className={`self-end px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ${
                !input.trim() || isLoading || uploadingPdf || processingText ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}