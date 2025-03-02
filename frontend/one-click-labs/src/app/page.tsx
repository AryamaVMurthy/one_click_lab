"use client";

import { useTheme } from "@/context/ThemeContext";
import BasicTextEditor from "@/components/BasicTextEditor";

export default function Home() {
  const { theme } = useTheme();
  
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">One Click Labs - Basic Text Editor Test</h1>
      
      <div className="mb-8">
        <div className="mb-4">
          <p className="text-sm text-secondary-foreground mb-2">
            This is a simple test of the Novel text editor component.
          </p>
          <p className="text-sm text-secondary-foreground mb-4">
            Current theme: <span className="font-bold">{theme}</span>
          </p>
        </div>
        
        <BasicTextEditor />
      </div>
    </main>
  );
}
