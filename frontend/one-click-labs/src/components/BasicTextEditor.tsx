"use client";

import React, { useState } from "react";

export default function BasicTextEditor() {
  const [editorContent, setEditorContent] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setEditorContent(content);
    localStorage.setItem("editor-content", content);
  };

  return (
    <div className="w-full">
      <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 shadow-sm min-h-[300px]">
        <textarea
          className="w-full h-64 p-4 bg-white dark:bg-gray-900 text-foreground focus:outline-none"
          onChange={handleChange}
          value={editorContent}
          placeholder="Type your content here..."
        />
      </div>
      
      {/* Debug section */}
      <div className="mt-4 p-3 bg-secondary rounded-md">
        <h3 className="font-medium text-sm mb-2">Current Content:</h3>
        <pre className="text-xs overflow-auto max-h-32 p-2 bg-card border border-border-color rounded">
          {editorContent || "<empty>"}
        </pre>
      </div>
    </div>
  );
}
