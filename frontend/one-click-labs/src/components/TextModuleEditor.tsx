"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { TextModule } from "@/types/models";
import sanitizeHtml from 'sanitize-html';

interface TextModuleEditorProps {
  module: TextModule;
  onChange: (updatedModule: TextModule) => void;
}

export default function TextModuleEditor({ module, onChange }: TextModuleEditorProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(module.title || "");
  const [content, setContent] = useState(module.content || "");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Store the selection for restoring cursor position
  const savedSelectionRef = useRef<Range | null>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && module.content) {
      editorRef.current.innerHTML = module.content;
    }
  }, []);

  // Update title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onChange({
      ...module,
      title: newTitle,
    });
  };

  // Update content when the editor changes
  const handleContentChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const sanitized = sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'iframe'
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          '*': ['style', 'class'],
          'img': ['src', 'alt', 'width', 'height', 'style', 'class'],
          'iframe': [
            'src', 'width', 'height', 'frameborder', 'allowfullscreen', 
            'allow', 'style', 'class'
          ]
        },
        allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com', 'www.loom.com'],
      });
      setContent(sanitized);
      onChange({
        ...module,
        content: sanitized,
      });
    }
  };

  // Save the current selection position
  const saveSelection = () => {
    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel && sel.getRangeAt && sel.rangeCount) {
        savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
  };

  // Restore the previously saved selection
  const restoreSelection = () => {
    if (savedSelectionRef.current && window.getSelection) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  // Format text based on command
  const formatText = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleContentChange();
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && editorRef.current) {
        // Insert the image at cursor position
        const imgHtml = `<img src="${event.target.result}" alt="Uploaded Image" style="max-width: 100%;" />`;
        document.execCommand('insertHTML', false, imgHtml);
        handleContentChange();
      }
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open video modal and save current selection
  const handleOpenVideoModal = () => {
    saveSelection();
    setShowVideoModal(true);
  };

  // Handle video embedding
  const handleVideoEmbed = () => {
    if (!videoUrl.trim()) {
      alert('Please enter a valid video URL');
      return;
    }

    let embedCode = '';
    let sourceLink = '';

    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const youtubeId = extractYoutubeId(videoUrl);
      if (youtubeId) {
        sourceLink = `https://www.youtube.com/watch?v=${youtubeId}`;
        embedCode = `
          <div class="video-embed-container" style="margin: 1rem 0; max-width: 100%;">
            <div style="position: relative; width: 100%; max-width: 560px; margin: 0 auto;">
              <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 6px;">
                <iframe 
                  src="https://www.youtube.com/embed/${youtubeId}" 
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen>
                </iframe>
              </div>
              <div style="text-align: center; margin-top: 0.5rem;">
                <a href="${sourceLink}" target="_blank" rel="noopener noreferrer" style="font-size: 0.875rem; color: #0070f3; text-decoration: none;">
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        `;
      } else {
        alert('Could not parse YouTube URL. Please check the URL and try again.');
        return;
      }
    } 
    // Vimeo
    else if (videoUrl.includes('vimeo.com')) {
      const vimeoId = extractVimeoId(videoUrl);
      if (vimeoId) {
        sourceLink = `https://vimeo.com/${vimeoId}`;
        embedCode = `
          <div class="video-embed-container" style="margin: 1rem 0; max-width: 100%;">
            <div style="position: relative; width: 100%; max-width: 560px; margin: 0 auto;">
              <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 6px;">
                <iframe 
                  src="https://player.vimeo.com/video/${vimeoId}" 
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
                  frameborder="0" 
                  allow="autoplay; fullscreen; picture-in-picture" 
                  allowfullscreen>
                </iframe>
              </div>
              <div style="text-align: center; margin-top: 0.5rem;">
                <a href="${sourceLink}" target="_blank" rel="noopener noreferrer" style="font-size: 0.875rem; color: #0070f3; text-decoration: none;">
                  Watch on Vimeo
                </a>
              </div>
            </div>
          </div>
        `;
      } else {
        alert('Could not parse Vimeo URL. Please check the URL and try again.');
        return;
      }
    } 
    // Default embed as URL link if not recognized
    else {
      sourceLink = videoUrl;
      embedCode = `<p style="text-align: center; margin: 1rem 0;"><a href="${videoUrl}" target="_blank" rel="noopener noreferrer" style="color: #0070f3;">${videoUrl}</a></p>`;
    }

    if (editorRef.current && embedCode) {
      // Restore cursor position before inserting
      editorRef.current.focus();
      restoreSelection();
      
      // Use insertHTML command to insert the embed code
      document.execCommand('insertHTML', false, embedCode);
      
      // Clean up selection reference to prevent issues with future inserts
      savedSelectionRef.current = null;
      
      // Update content state after insertion
      handleContentChange();
    }

    setVideoUrl('');
    setShowVideoModal(false);
  };

  // Extract YouTube ID from URL - improved regex to handle more URL formats
  const extractYoutubeId = (url: string): string | null => {
    // Handle both youtu.be/ID and youtube.com/?v=ID format
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  // Extract Vimeo ID from URL
  const extractVimeoId = (url: string): string | null => {
    const regExp = /vimeo\.com\/([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      {/* Module title input */}
      <div className="mb-4">
        <label htmlFor="module-title" className="block text-sm font-medium mb-1">
          Module Title
        </label>
        <input
          id="module-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="w-full px-3 py-2 border border-border-color rounded-md bg-background"
          placeholder="Enter a title for this module"
        />
      </div>

      {/* Formatting toolbar */}
      <div className="flex flex-wrap gap-1 mb-2 p-1 border border-border-color rounded-md bg-background">
        <ToolbarButton onClick={() => formatText('formatBlock', '<h1>')} tooltip="Heading 1">H1</ToolbarButton>
        <ToolbarButton onClick={() => formatText('formatBlock', '<h2>')} tooltip="Heading 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => formatText('formatBlock', '<h3>')} tooltip="Heading 3">H3</ToolbarButton>
        <ToolbarButton onClick={() => formatText('formatBlock', '<p>')} tooltip="Paragraph">P</ToolbarButton>
        <div className="w-px h-6 bg-border-color mx-1"></div>
        <ToolbarButton onClick={() => formatText('bold')} tooltip="Bold">
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => formatText('italic')} tooltip="Italic">
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => formatText('underline')} tooltip="Underline">
          <UnderlineIcon />
        </ToolbarButton>
        <div className="w-px h-6 bg-border-color mx-1"></div>
        <ToolbarButton onClick={() => formatText('insertUnorderedList')} tooltip="Bullet List">
          <ListBulletIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => formatText('insertOrderedList')} tooltip="Numbered List">
          <ListNumberedIcon />
        </ToolbarButton>
        <div className="w-px h-6 bg-border-color mx-1"></div>
        <ToolbarButton onClick={() => formatText('justifyLeft')} tooltip="Align Left">
          <AlignLeftIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => formatText('justifyCenter')} tooltip="Align Center">
          <AlignCenterIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => formatText('justifyRight')} tooltip="Align Right">
          <AlignRightIcon />
        </ToolbarButton>
        <div className="w-px h-6 bg-border-color mx-1"></div>
        
        {/* Image upload button */}
        <ToolbarButton 
          onClick={() => fileInputRef.current?.click()} 
          tooltip="Insert Image"
        >
          <ImageIcon />
        </ToolbarButton>

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        {/* Video embed button - updated to call handleOpenVideoModal */}
        <ToolbarButton 
          onClick={handleOpenVideoModal}
          tooltip="Embed Video"
        >
          <VideoIcon />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-border-color mx-1"></div>
        <ToolbarButton onClick={() => formatText('removeFormat')} tooltip="Clear Formatting">
          <ClearFormatIcon />
        </ToolbarButton>
      </div>

      {/* Rich text editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-4 border border-border-color rounded-md bg-background overflow-auto prose prose-sm dark:prose-invert focus:outline-none focus:ring-1 focus:ring-primary"
        onInput={handleContentChange}
        onBlur={handleContentChange}
        onKeyDown={(e) => {
          // Ensure selection can be tracked even when typing
          if (e.key !== 'Tab') {
            savedSelectionRef.current = null;
          }
        }}
        onClick={() => {
          // Clear selection on click to avoid stale positions
          savedSelectionRef.current = null;
        }}
      />

      {/* Preview */}
      <div className="mt-4 border-t border-border-color pt-4">
        <h4 className="text-sm font-medium mb-2">Preview:</h4>
        <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-background border border-border-color rounded-md">
          <div 
            dangerouslySetInnerHTML={{ __html: content }} 
            className="video-responsive"
          />
        </div>
      </div>

      {/* Video Embed Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Embed Video</h3>
            <p className="text-sm text-secondary-foreground mb-3">
              Enter YouTube or Vimeo video URL:
            </p>
            <input 
              type="text" 
              value={videoUrl} 
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-border-color rounded-md bg-background mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVideoEmbed();
                }
              }}
            />
            
            {/* Preview the link */}
            {videoUrl.trim() && (
              <div className="mb-4 p-2 bg-secondary rounded text-xs overflow-hidden text-ellipsis">
                <span className="font-medium">URL:</span> {videoUrl}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setShowVideoModal(false);
                  // Focus back on editor after closing without embedding
                  setTimeout(() => {
                    if (editorRef.current) {
                      editorRef.current.focus();
                      restoreSelection();
                    }
                  }, 10);
                }}
                className="px-4 py-2 border border-border-color rounded-md hover:bg-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleVideoEmbed}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Embed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Toolbar button component
interface ToolbarButtonProps {
  onClick: () => void;
  tooltip: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, tooltip, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary text-foreground"
    >
      {children}
    </button>
  );
}

// Icons for toolbar
function BoldIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13H8.21zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z"/></svg>;
}

function ItalicIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z"/></svg>;
}

function UnderlineIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57-1.709 0-2.687-1.08-2.687-2.57V3.136zM12.5 15h-9v-1h9v1z"/></svg>;
}

function ListBulletIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>;
}

function ListNumberedIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/><path d="M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309.254 0 .424-.145.422-.35-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844.583 0 .96.326.96.756 0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508 0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338v.041zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635V5z"/></svg>;
}

function AlignLeftIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/></svg>;
}

function AlignCenterIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/></svg>;
}

function AlignRightIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/></svg>;
}

function ClearFormatIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13H8.21zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z"/><path d="M14.146.146a.5.5 0 0 1 .708 0l1 1a.5.5 0 0 1 0 .708l-10.5 10.5a.5.5 0 0 1-.708 0l-1-1a.5.5 0 0 1 0-.708l10.5-10.5z"/></svg>;
}

function ImageIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/><path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/></svg>;
}

function VideoIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1zm4 0v6h8V1H4zm8 8H4v6h8V9zM1 1v2h2V1H1zm2 3H1v2h2V4zM1 7v2h2V7H1zm2 3H1v2h2v-2zm-2 3v2h2v-2H1zM15 1h-2v2h2V1zm-2 3v2h2V4h-2zm2 3h-2v2h2V7zm-2 3v2h2v-2h-2zm2 3h-2v2h2v-2z"/></svg>;
}
