"use client";

import React, { useState } from 'react';
import { Lab } from '@/types/models';

interface ExportLabButtonProps {
  lab: Lab;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export default function ExportLabButton({ lab, variant = 'primary', className = '' }: ExportLabButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generateLabHTML = () => {
    setIsExporting(true);
    
    try {
      // Create HTML content
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lab.title} - One Click Labs</title>
  <style>
    /* Base styles */
    :root {
      --primary-color: #3b82f6;
      --text-color: #1f2937;
      --bg-color: #ffffff;
      --secondary-bg: #f9fafb;
      --border-color: #e5e7eb;
      --secondary-text: #4b5563;
      --success-color: #10b981;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --primary-color: #60a5fa;
        --text-color: #f9fafb;
        --bg-color: #111827;
        --secondary-bg: #1f2937;
        --border-color: #374151;
        --secondary-text: #9ca3af;
        --success-color: #34d399;
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      background-color: var(--bg-color);
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    h1, h2, h3, h4 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      line-height: 1.3;
    }

    h1 { 
      font-size: 2.25rem; 
      margin-top: 0;
    }
    h2 { font-size: 1.75rem; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }

    .section {
      margin-bottom: 3rem;
      padding: 1.5rem;
      background-color: var(--secondary-bg);
      border-radius: 0.5rem;
      border: 1px solid var(--border-color);
    }

    .module {
      margin-bottom: 2rem;
      padding: 1rem;
      background-color: var(--bg-color);
      border-radius: 0.375rem;
      border: 1px solid var(--border-color);
    }

    .module-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 1rem;
      color: var(--primary-color);
    }

    .quiz-question {
      margin-bottom: 1.5rem;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
    }

    .quiz-option {
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 0.25rem;
    }

    .quiz-option.correct {
      border-left: 4px solid var(--success-color);
    }

    .quiz-explanation {
      margin-top: 1rem;
      padding: 0.75rem;
      background-color: rgba(59, 130, 246, 0.1);
      border-radius: 0.25rem;
      font-style: italic;
    }

    .meta {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--secondary-text);
    }

    a {
      color: var(--primary-color);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    img, video {
      max-width: 100%;
      height: auto;
      border-radius: 0.375rem;
    }

    .footnote {
      margin-top: 4rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.875rem;
      color: var(--secondary-text);
      text-align: center;
    }

    /* Responsive video containers */
    .video-responsive {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
      height: 0;
      overflow: hidden;
      margin: 1.5rem 0;
    }
    
    .video-responsive iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 0;
    }

    /* Print styles */
    @media print {
      body {
        font-size: 12pt;
        background-color: white;
        color: black;
      }
      
      .section, .module {
        page-break-inside: avoid;
        border: 1px solid #ddd;
        background-color: white;
      }

      a {
        color: #2563eb;
      }

      @page {
        margin: 1.5cm;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${lab.title}</h1>
      <p>${lab.description}</p>
      <div class="meta">
        ${lab.author?.name ? `Created by: ${lab.author.name}<br>` : ''}
        ${lab.publishedAt ? `Published: ${new Date(lab.publishedAt).toLocaleDateString()}<br>` : ''}
        Exported: ${new Date().toLocaleDateString()}
      </div>
    </header>

    <main>
      ${lab.sections.map((section, sIndex) => `
        <div class="section">
          <h2>Section ${sIndex + 1}: ${section.title}</h2>
          
          ${section.modules.map((module, mIndex) => {
            // Text module
            if (module.type === 'text') {
              return `
                <div class="module">
                  <h3 class="module-title">${(module as { title?: string }).title || `Module ${mIndex + 1}`}</h3>
                  <div class="module-content">
                    ${module.content}
                  </div>
                </div>
              `;
            }
            
            // Quiz module
            else if (module.type === 'quiz') {
              return `
                <div class="module">
                  <h3 class="module-title">${module.title || `Quiz ${mIndex + 1}`}</h3>
                  <div class="module-content">
                    <p>This quiz contains ${module.questions.length} questions.</p>
                    
                    ${module.questions.map((question, qIndex) => `
                      <div class="quiz-question">
                        <h4>${qIndex + 1}. ${question.text}</h4>
                        
                        ${question.options?.map(option => `
                          <div class="quiz-option ${option.isCorrect ? 'correct' : ''}">
                            ${option.text} ${option.isCorrect ? '✓' : ''}
                          </div>
                        `).join('')}
                        
                        ${question.explanation ? `
                          <div class="quiz-explanation">
                            <strong>Explanation:</strong> ${question.explanation}
                          </div>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }
            
            // Image module
            else if (module.type === 'image') {
              return `
                <div class="module">
                  <h3 class="module-title">${module.title || `Image ${mIndex + 1}`}</h3>
                  <div class="module-content text-center">
                    <img src="${module.url}" alt="${module.altText || module.title || 'Image'}" />
                    ${module.caption ? `<p><em>${module.caption}</em></p>` : ''}
                  </div>
                </div>
              `;
            }
            
            // Video module
            else if (module.type === 'video') {
              let videoEmbed = '';
              
              if (module.provider === 'youtube') {
                const youtubeId = extractYoutubeId(module.url);
                if (youtubeId) {
                  videoEmbed = `
                    <div class="video-responsive">
                      <iframe src="https://www.youtube.com/embed/${youtubeId}" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowfullscreen></iframe>
                    </div>
                  `;
                }
              } else if (module.provider === 'vimeo') {
                const vimeoId = extractVimeoId(module.url);
                if (vimeoId) {
                  videoEmbed = `
                    <div class="video-responsive">
                      <iframe src="https://player.vimeo.com/video/${vimeoId}" 
                              allow="autoplay; fullscreen; picture-in-picture" 
                              allowfullscreen></iframe>
                    </div>
                  `;
                }
              } else {
                videoEmbed = `<p><a href="${module.url}" target="_blank">Watch video</a></p>`;
              }
              
              return `
                <div class="module">
                  <h3 class="module-title">${module.title || `Video ${mIndex + 1}`}</h3>
                  <div class="module-content">
                    ${videoEmbed}
                    ${module.caption ? `<p><em>${module.caption}</em></p>` : ''}
                  </div>
                </div>
              `;
            }
            
            // Default case for other module types
            return `
              <div class="module">
                <h3 class="module-title">${(module as { title?: string }).title || `Module ${mIndex + 1}`}</h3>
                <div class="module-content">
                  <p>This content type (${(module as any).type}) is not fully supported in the static export.</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
    </main>

    <footer class="footnote">
      <p>
        Exported from One Click Labs<br>
        This document contains the full content of "${lab.title}"
      </p>
    </footer>
  </div>
</body>
</html>
      `;
      
      // Create a downloadable blob
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lab.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-export.html`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating lab HTML:', error);
      alert('Failed to generate HTML export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Helper functions for video URLs
  function extractYoutubeId(url: string): string {
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/;
    const match = url?.match(regExp);
    return (match && match[1].length === 11) ? match[1] : '';
  }
  
  function extractVimeoId(url: string): string {
    const regExp = /vimeo\.com\/([0-9]+)/;
    const match = url?.match(regExp);
    return match ? match[1] : '';
  }

  // Determine button styling based on variant
  let buttonClasses = 'px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 ';
  
  if (variant === 'primary') {
    buttonClasses += 'bg-primary text-primary-foreground hover:opacity-90';
  } else if (variant === 'secondary') {
    buttonClasses += 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
  } else if (variant === 'outline') {
    buttonClasses += 'border border-border-color hover:bg-secondary/50 text-foreground';
  }
  
  if (className) {
    buttonClasses += ' ' + className;
  }

  return (
    <button 
      onClick={generateLabHTML}
      className={buttonClasses}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <LoadingIcon className="animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <ExportIcon />
          Export HTML
        </>
      )}
    </button>
  );
}

function ExportIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function LoadingIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
