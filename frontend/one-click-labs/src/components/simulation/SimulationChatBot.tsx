'use client';

import React, { useState, useRef, useEffect } from 'react';
import { generateSimulation } from '@/api/apiClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AgentType = 'html' | 'json' | 'both' | null;

interface SimulationChatBotProps {
  onStructureGenerated: (structure: any) => void;
  onCodeGenerated: (htmlContent?: string) => void; // Update prop type to accept HTML content
}

const SimulationChatBot: React.FC<SimulationChatBotProps> = ({
  onStructureGenerated,
  onCodeGenerated,
}) => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Hello! I\'m your simulation assistant. Please select which type of agent you\'d like to work with:',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(null);
  const [jsonState, setJsonState] = useState<any>(null); 
  const [htmlMemory, setHtmlMemory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAgentSelect = async (agentType: AgentType) => {
    setSelectedAgent(agentType);
    const agentMessage: Message = {
      role: 'assistant',
      content: getAgentWelcomeMessage(agentType),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMessage]);
  };

  const getAgentWelcomeMessage = (agentType: AgentType): string => {
    switch (agentType) {
      case 'html':
        return "I'll help you generate HTML, CSS, and JavaScript code for your simulation. What would you like to create?";
      case 'json':
        return "I'll help you create the simulation structure in JSON format. What kind of simulation would you like to build?";
      case 'both':
        return "I'll help you create both the simulation structure and the implementation code. What would you like to build?";
      default:
        return '';
    }
  };

  // Function to generate simulation based on agent type
  const generateSimulationContent = async (userInput: string, agent: AgentType): Promise<void> => {
    if (!agent) return;
    
    setIsLoading(true);
    onCodeGenerated(); // Signal to parent that generation is starting
    
    try {
      console.log("Calling API with:", { input: userInput, agent, jsonState });
      
      // Format chat memory for the API
      const chatMemory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call the simulation API
      const response = await generateSimulation(
        userInput,
        agent,
        jsonState,
        htmlMemory || undefined,
        chatMemory
      );

      console.log("API Response:", response);

      if (response.success && response.data) {
        let responseMessage = '';
        
        // Handle JSON response
        if ((agent === 'json' || agent === 'both') && response.data.json) {
          console.log("Received JSON:", response.data.json);
          setJsonState(response.data.json);
          onStructureGenerated(response.data.json); // Update structure in parent
          responseMessage += 'I\'ve generated a JSON structure for your simulation. You can view and edit it in the structure editor.';
        }

        // Handle HTML response
        if ((agent === 'html' || agent === 'both') && response.data.html) {
          console.log("Received HTML of length:", response.data.html?.length);
          setHtmlMemory(response.data.html);
          
          // THIS IS THE KEY CHANGE: Pass the HTML to the parent component
          onCodeGenerated(response.data.html);
          
          if (responseMessage) {
            responseMessage += ' I\'ve also generated the HTML, CSS, and JavaScript code for the simulation. You can view it in the code editor and preview tabs.';
          } else {
            responseMessage = 'I\'ve generated the HTML, CSS, and JavaScript code for the simulation. You can view it in the code editor and preview tabs.';
          }
        }

        // Add error message if no response was generated
        if (!responseMessage) {
          if (agent === 'json') {
            responseMessage = 'I was unable to generate a JSON structure for your simulation. Please try again with a different prompt.';
          } else if (agent === 'html') {
            responseMessage = 'I was unable to generate the HTML code for your simulation. Please try again with a different prompt.';
          } else {
            responseMessage = 'I was unable to generate the simulation content. Please try again with a different prompt.';
          }
        }

        // Add assistant response message
        const assistantMessage: Message = {
          role: 'assistant',
          content: responseMessage,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle API error
        const errorMessage: Message = {
          role: 'assistant',
          content: `Sorry, there was an error generating your simulation: ${response.error || 'Unknown error'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error generating simulation:", error);
      // Handle unexpected errors
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, there was an unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedAgent) return;

    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    const userInput = input;
    setInput(''); // Clear input field

    // Generate simulation content
    await generateSimulationContent(userInput, selectedAgent);
  };

  // Function to format time consistently between server and client
  const formatTime = (date: Date): string => {
    // Use a fixed format with 12-hour clock that doesn't depend on locale
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    return `${hour12}:${minutes}:${seconds} ${ampm}`;
  };

  // Auto-resize the textarea as content grows
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to calculate proper scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to match content (with a max-height applied via CSS)
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Update textarea height whenever input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle special keypresses like Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If it's Enter without Shift, submit the form
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
    // If it's Shift+Enter, let the default behavior happen (new line)
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex justify-between items-center p-4 border-b border-border-color">
        <h2 className="text-lg font-bold">Simulation Assistant</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleAgentSelect('html')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedAgent === 'html'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            HTML Agent
          </button>
          <button
            onClick={() => handleAgentSelect('json')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedAgent === 'json'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            JSON Agent
          </button>
          <button
            onClick={() => handleAgentSelect('both')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedAgent === 'both'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Both
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-secondary-foreground max-w-[80%] p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border-color">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={selectedAgent ? "Type your message... (Shift+Enter for new line)" : "Please select an agent type first"}
              className="w-full p-2 rounded-lg bg-background border border-border-color focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-hidden min-h-[40px] max-h-[200px]"
              disabled={isLoading || !selectedAgent}
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !selectedAgent || !input.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed self-end"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimulationChatBot;
