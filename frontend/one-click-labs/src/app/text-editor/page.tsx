"use client";

import { useState } from 'react';
import { createTextModule, TextModule } from '@/types/models';
import TextModuleEditor from '@/components/TextModuleEditor';
import { useTheme } from '@/context/ThemeContext';

export default function TextEditorPage() {
  const { theme } = useTheme();
  
  // Create initial sample module with content
  const [module, setModule] = useState<TextModule>(
    createTextModule({
      title: 'Rich Text Editing Demo',
      content: `
        <h1>Welcome to the Text Editor</h1>
        <p>This is a <strong>rich text editor</strong> for One Click Labs. You can format your content in various ways:</p>
        <ul>
          <li>Use <em>italic</em> or <strong>bold</strong> formatting</li>
          <li>Create lists (ordered and unordered)</li>
          <li>Use different heading levels</li>
          <li>Align text as needed</li>
        </ul>
        <p>Try editing this content or creating your own!</p>
      `,
    })
  );

  // Handle module changes
  const handleModuleChange = (updatedModule: TextModule) => {
    setModule(updatedModule);
    console.log('Module updated:', updatedModule);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Text Module Editor Demo</h1>
      
      <div className="mb-8">
        <TextModuleEditor 
          module={module} 
          onChange={handleModuleChange} 
        />
      </div>
      
      <div className="mt-8 p-4 border border-border-color rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Module Data:</h2>
        <pre className="bg-secondary p-4 rounded overflow-auto text-xs max-h-96">
          {JSON.stringify(module, null, 2)}
        </pre>
      </div>
    </div>
  );
}
