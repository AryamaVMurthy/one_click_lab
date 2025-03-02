"use client";

import React, { useState } from "react";
import {
  EditorRoot,
  EditorContent,
} from "novel";
import "novel/styles.css";

export default function BasicTextEditor() {
  const [editorContent, setEditorContent] = useState<string>("");

  // Handle content updates
  const handleUpdate = ({ editor }: { editor: any }) => {
    if (editor) {
      const html = editor.getHTML();
      setEditorContent(html);
      localStorage.setItem("editor-content", html);
    }
  };

  return (
    <div className="w-full">
      <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 shadow-sm min-h-[300px]">
        <EditorRoot>
          <EditorContent
            editorProps={{
              attributes: {
                class: "prose prose-sm sm:prose dark:prose-invert min-w-full focus:outline-none p-2"
              }
            }}
            onUpdate={handleUpdate}
          />
        </EditorRoot>
      </div>
      
      {/* Debug section */}
      <div className="mt-4 p-3 bg-secondary rounded-md">
        <h3 className="font-medium text-sm mb-2">Current HTML Content:</h3>
        <pre className="text-xs overflow-auto max-h-32 p-2 bg-card border border-border-color rounded">
          {editorContent || "<empty>"}
        </pre>
      </div>
    </div>
  );
}
