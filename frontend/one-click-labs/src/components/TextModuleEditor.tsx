"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { TextModule } from "@/types/models";
import sanitizeHtml from 'sanitize-html';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface TextModuleEditorProps {
  module: TextModule;
  onChange: (updatedModule: TextModule) => void;
}

export default function TextModuleEditor({ module, onChange }: TextModuleEditorProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(module.title || "");
  const [content, setContent] = useState(module.content || "");
  const [showMathPopup, setShowMathPopup] = useState(false);
  const [mathInput, setMathInput] = useState("");
  const [showHtmlPopup, setShowHtmlPopup] = useState(false);
  const [htmlInput, setHtmlInput] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  const formatText = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleContentChange();
  };

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
        const imgHtml = `<img src="${event.target.result}" alt="Uploaded Image" style="max-width: 100%;" />`;
        document.execCommand('insertHTML', false, imgHtml);
        handleContentChange();
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMathInsert = () => {
    try {
      const html = katex.renderToString(mathInput, {
        throwOnError: false,
        output: 'html',
      });
      
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, html);
        handleContentChange();
      }
      setMathInput("");
      setShowMathPopup(false);
    } catch (error) {
      alert("Invalid LaTeX syntax. Please check your equation.");
    }
  };

  const handleHtmlInsert = () => {
    if (editorRef.current && htmlInput) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, htmlInput);
      handleContentChange();
      setHtmlInput("");
      setShowHtmlPopup(false);
    }
  };

  const handleVideoEmbed = () => {
    if (!videoUrl.trim()) {
      alert('Please enter a valid video URL');
      return;
    }

    let embedCode = '';
    const youtubeId = extractYoutubeId(videoUrl);
    const vimeoId = extractVimeoId(videoUrl);

    if (youtubeId) {
      embedCode = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (vimeoId) {
      embedCode = `<iframe src="https://player.vimeo.com/video/${vimeoId}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    } else {
      alert('Invalid video URL. Please use YouTube or Vimeo.');
      return;
    }

    if (editorRef.current && embedCode) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, embedCode);
      handleContentChange();
    }
    setShowVideoModal(false);
  };

  const saveSelection = () => {
    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel && sel.getRangeAt && sel.rangeCount) {
        savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRef.current && window.getSelection) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const sanitized = sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
          'img', 'iframe', 'div', 'span', 'script',
          'style', 'pre', 'code', 'kbd', 'samp',
          'var', 'sub', 'sup', 'small', 'strong',
          'em', 'mark', 'del', 'ins', 'abbr',
          'dfn', 'cite', 'q', 's', 'time'
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          '*': ['style', 'class', 'id'],
          'img': ['src', 'alt', 'width', 'height', 'style', 'class'],
          'iframe': [
            'src', 'width', 'height', 'frameborder', 
            'allowfullscreen', 'allow', 'style', 'class'
          ],
          'div': ['style', 'class'],
          'span': ['style', 'class'],
          'script': ['type'],
          'style': ['type'],
        },
        allowedIframeHostnames: [
          'www.youtube.com', 'player.vimeo.com', 
          'www.loom.com', 'cdn.jsdelivr.net'
        ],
      });
      setContent(sanitized);
      onChange({
        ...module,
        content: sanitized,
      });
    }
  };

  const extractYoutubeId = (url: string): string | null => {
    // Handle both youtu.be/ID and youtube.com/?v=ID format
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const extractVimeoId = (url: string): string | null => {
    const regExp = /vimeo\.com\/([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <div className="mb-4">
        <label htmlFor="module-title" className="block text-sm font-medium mb-1">
          Module Title
        </label>
        <input
          id="module-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border-color rounded-md bg-background"
          placeholder="Enter a title for this module"
        />
      </div>

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

        <ToolbarButton 
          onClick={() => fileInputRef.current?.click()} 
          tooltip="Insert Image"
        >
          <ImageIcon />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => { saveSelection(); setShowVideoModal(true); }}
          tooltip="Embed Video"
        >
          <VideoIcon />
        </ToolbarButton>

        <ToolbarButton 
          onClick={() => setShowMathPopup(true)}
          tooltip="Insert Math Equation"
        >
          <span className="font-math">∑</span>
        </ToolbarButton>

        <ToolbarButton 
          onClick={() => setShowHtmlPopup(true)}
          tooltip="Insert Custom HTML"
        >
          <span className="font-mono">{'</>'}</span>
        </ToolbarButton>

        <ToolbarButton onClick={() => formatText('removeFormat')} tooltip="Clear Formatting">
          <ClearFormatIcon />
        </ToolbarButton>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-4 border border-border-color rounded-md bg-background overflow-auto prose prose-sm dark:prose-invert focus:outline-none focus:ring-1 focus:ring-primary"
        onInput={handleContentChange}
        onBlur={handleContentChange}
        onKeyDown={(e) => {
          if (e.key !== 'Tab') {
            savedSelectionRef.current = null;
          }
        }}
        onClick={() => {
          savedSelectionRef.current = null;
        }}
      />

      {showMathPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Insert Math Equation</h3>
            <textarea
              value={mathInput}
              onChange={(e) => setMathInput(e.target.value)}
              placeholder="Enter LaTeX equation"
              className="w-full h-32 p-2 border border-border-color rounded-md bg-background mb-4"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowMathPopup(false)}
                className="px-4 py-2 border border-border-color rounded-md hover:bg-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleMathInsert}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {showHtmlPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Insert Custom HTML</h3>
            <textarea
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              placeholder="Enter custom HTML"
              className="w-full h-32 p-2 border border-border-color rounded-md bg-background mb-4"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowHtmlPopup(false)}
                className="px-4 py-2 border border-border-color rounded-md hover:bg-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleHtmlInsert}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Embed Video</h3>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter YouTube or Vimeo URL"
              className="w-full p-2 border border-border-color rounded-md bg-background mb-4"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowVideoModal(false)}
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
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13H8.21zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z"/><path d="M14.146.146a.5.5 0 0 1 .708 0l1 1a.5.5 0 0 1 0 .708l-10.5 10.5a.5.5 0 0 1-.708 0l-1-1a.5.5 0 0 1 0-.708l10.5-10.5z"/></svg>;
}

function ItalicIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z"/></svg>;
}

function UnderlineIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57-1.709 0-2.687-1.08-2.687-2.57V3.136zM12.5 15h-9v-1h9v1z"/></svg>;
}

function ListBulletIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>;
}

function ListNumberedIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3H4v2h2V4zm8 8H4v2h10V9zM1 1v2h2V1H1zm2 3H1v2h2V4zM1 7v2h2V7H1zm2 3H1v2h2v-2zm-2 3v2h2v-2H1zM15 1h-2v2h2V1zm-2 3v2h2V4h-2zm2 3h-2v2h2V7zm-2 3v2h2v-2h-2zm2 3h-2v2h2v-2z"/></svg>;
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
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/><path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-5 1.5v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/></svg>;
}

function VideoIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1zm4 0v6h8V1H4zm8 8H4v6h8V9zM1 1v2h2V1H1zm2 3H1v2h2V4zM1 7v2h2V7H1zm2 3H1v2h2v-2zm-2 3v2h2v-2H1zM15 1h-2v2h2V1zm-2 3v2h2V4h-2zm2 3h-2v2h2V7zm-2 3v2h2v-2h-2zm2 3h-2v2h2v-2z"/></svg>;
}
