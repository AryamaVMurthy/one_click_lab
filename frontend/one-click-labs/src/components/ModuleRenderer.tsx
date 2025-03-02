"use client";

import { useState, useEffect } from "react";
import { Module, isTextModule, isQuizModule, isImageModule, isVideoModule, QuizQuestion } from "@/types/models";

interface ModuleRendererProps {
  module: Module;
  onComplete?: () => void;
}

export default function ModuleRenderer({ module, onComplete }: ModuleRendererProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState({ points: 0, total: 0 });
  
  // Mark module as completed when user has engaged with it sufficiently
  useEffect(() => {
    if (hasInteracted && onComplete && !isQuizModule(module)) {
      // For regular modules, mark as complete after interaction
      onComplete();
    }
  }, [hasInteracted, module, onComplete]);

  // Handle scroll events to track if user has interacted with the content
  useEffect(() => {
    const handleScroll = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Set a timer to mark as read after some time
    const timer = setTimeout(() => {
      if (!hasInteracted && !isQuizModule(module)) {
        setHasInteracted(true);
      }
    }, 10000); // Mark as read after 10 seconds
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [hasInteracted, module]);

  // Handle quiz submission
  const handleQuizSubmit = () => {
    if (!isQuizModule(module)) return;
    
    let earnedPoints = 0;
    let totalPoints = 0;
    
    module.questions.forEach((question) => {
      totalPoints += question.points;
      
      // Get user's selected options for this question
      const selectedOptionIds = quizAnswers[question.id] || [];
      
      // For multiple-answer questions, all correct options must be selected
      // and no incorrect options should be selected
      const correctOptionIds = question.options
        ?.filter((o) => o.isCorrect)
        .map((o) => o.id) || [];
        
      const incorrectOptionIds = question.options
        ?.filter((o) => !o.isCorrect)
        .map((o) => o.id) || [];
      
      // Check if any incorrect options were selected
      const anyIncorrectSelected = selectedOptionIds.some(id => 
        incorrectOptionIds.includes(id)
      );
      
      if (anyIncorrectSelected) {
        // No points if incorrect answers selected
        earnedPoints += 0;
      } else {
        // Calculate partial points based on ratio of correct answers selected
        const correctSelectedCount = selectedOptionIds.filter(id => 
          correctOptionIds.includes(id)
        ).length;
        
        if (correctOptionIds.length > 0 && correctSelectedCount > 0) {
          const partialPoints = question.points * (correctSelectedCount / correctOptionIds.length);
          earnedPoints += partialPoints;
        }
      }
    });
    
    setQuizScore({
      points: Math.round(earnedPoints * 100) / 100,
      total: totalPoints
    });
    
    setQuizSubmitted(true);
    
    // If the user passed the quiz, mark it as completed
    if (earnedPoints > 0 && onComplete) {
      onComplete();
    }
  };

  // Reset quiz
  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore({ points: 0, total: 0 });
  };

  // Handle user answer selection
  const handleAnswerSelection = (questionId: string, optionId: string) => {
    if (quizSubmitted) return; // Can't change answers after submission
    
    const currentAnswers = quizAnswers[questionId] || [];
    
    // Toggle selection
    const updatedAnswers = currentAnswers.includes(optionId)
      ? currentAnswers.filter(id => id !== optionId)
      : [...currentAnswers, optionId];
    
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: updatedAnswers
    });
  };

  // Render appropriate content based on module type
  if (isTextModule(module)) {
    return (
      <div 
        className="prose prose-sm md:prose-base dark:prose-invert max-w-none"
        onClick={() => setHasInteracted(true)}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: module.content }} 
          className="video-responsive" // For responsive video embeds
        />
      </div>
    );
  }

  if (isQuizModule(module)) {
    return (
      <div className="quiz-module">
        {/* Quiz introduction */}
        <div className="mb-6">
          {module.title && <h3 className="text-xl font-bold mb-2">{module.title}</h3>}
          <p className="text-secondary-foreground">
            This quiz contains {module.questions.length} questions. 
            {module.passingScore && <span> Passing score: {module.passingScore}%</span>}
          </p>
        </div>

        {/* Quiz questions */}
        <div className="space-y-8">
          {module.questions.map((question, qIndex) => (
            <div 
              key={question.id} 
              className="border border-border-color rounded-lg p-4 bg-background/50"
            >
              <h4 className="font-medium text-lg mb-3 flex justify-between">
                <span>{qIndex + 1}. {question.text}</span>
                <span className="text-sm text-secondary-foreground">{question.points} {question.points === 1 ? 'point' : 'points'}</span>
              </h4>

              <div className="space-y-2 mt-4">
                {question.options?.map(option => {
                  const isSelected = (quizAnswers[question.id] || []).includes(option.id);
                  const isCorrect = option.isCorrect;
                  
                  // Determine styling based on submission state
                  let optionClasses = "p-3 rounded-md border transition-colors ";
                  
                  if (quizSubmitted) {
                    if (isCorrect && isSelected) {
                      // Correct answer selected
                      optionClasses += "bg-green-100/30 border-green-500/50 dark:bg-green-900/30 dark:border-green-600/50";
                    } else if (isCorrect) {
                      // Correct answer not selected
                      optionClasses += "border-green-500/50 dark:border-green-600/50";
                    } else if (isSelected) {
                      // Incorrect answer selected
                      optionClasses += "bg-red-100/30 border-red-500/50 dark:bg-red-900/30 dark:border-red-600/50";
                    } else {
                      // Neutral styling
                      optionClasses += "border-border-color";
                    }
                  } else {
                    // Not submitted
                    optionClasses += isSelected 
                      ? "bg-primary/10 border-primary dark:bg-primary/20"
                      : "border-border-color hover:border-primary/60 hover:shadow-md cursor-pointer";
                  }
                  
                  return (
                    <div 
                      key={option.id}
                      className={optionClasses}
                      onClick={() => !quizSubmitted && handleAnswerSelection(question.id, option.id)}
                    >
                      <div className="flex items-center">
                        <div className={`flex justify-center items-center h-5 w-5 mr-3 rounded border ${
                          isSelected 
                            ? 'bg-primary border-primary text-white' 
                            : 'border-gray-400 dark:border-gray-600'
                        }`}>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-foreground">{option.text}</span>
                        
                        {/* Show correct/incorrect indicators after submission */}
                        {quizSubmitted && (
                          <>
                            {isCorrect && (
                              <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                            )}
                            {isSelected && !isCorrect && (
                              <span className="ml-2 text-red-600 dark:text-red-400">✗</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Show explanation after submission */}
              {quizSubmitted && question.explanation && (
                <div className="mt-4 p-3 bg-blue-50/30 border border-blue-300/30 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded">
                  <span className="font-medium">Explanation:</span> {question.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quiz actions */}
        <div className="mt-8 flex justify-between items-center">
          {quizSubmitted ? (
            <>
              <div className="p-4 rounded-md border bg-card flex items-center gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
                    <span className="text-xl font-bold">
                      {Math.round((quizScore.points / quizScore.total) * 100)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-medium">{quizScore.points}/{quizScore.total} points</p>
                  <p className="text-sm text-secondary-foreground">
                    {quizScore.points >= quizScore.total / 2 ? 'Great job!' : 'Keep practicing!'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetQuiz}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/70"
              >
                Try Again
              </button>
            </>
          ) : (
            <button
              onClick={handleQuizSubmit}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isImageModule(module)) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <img 
          src={module.url} 
          alt={module.altText || module.title || "Image"} 
          className="max-w-full rounded-lg shadow-md"
          onClick={() => setHasInteracted(true)}
        />
        {module.caption && (
          <p className="text-sm text-secondary-foreground italic text-center">
            {module.caption}
          </p>
        )}
      </div>
    );
  }

  if (isVideoModule(module)) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="aspect-w-16 aspect-h-9 relative bg-black rounded-lg overflow-hidden">
          {module.provider === 'youtube' && (
            <iframe
              src={`https://www.youtube.com/embed/${extractYoutubeId(module.url)}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              onLoad={() => setHasInteracted(true)}
            ></iframe>
          )}
          {module.provider === 'vimeo' && (
            <iframe
              src={`https://player.vimeo.com/video/${extractVimeoId(module.url)}`}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              onLoad={() => setHasInteracted(true)}
            ></iframe>
          )}
          {module.provider === 'custom' && (
            <video
              src={module.url}
              controls
              className="absolute inset-0 w-full h-full"
              onPlay={() => setHasInteracted(true)}
            ></video>
          )}
        </div>
        {module.caption && (
          <p className="text-sm text-secondary-foreground italic text-center">
            {module.caption}
          </p>
        )}
      </div>
    );
  }

  // Fallback for unknown module types
  return (
    <div className="p-4 border border-border-color rounded-lg bg-card">
      <p className="text-secondary-foreground">
        This content type is not supported.
      </p>
    </div>
  );
}

// Helper functions
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

// Type guard for use in rendering
function isQuizQuestion(question: any): question is QuizQuestion {
  return question && typeof question.text === 'string' && Array.isArray(question.options);
}
