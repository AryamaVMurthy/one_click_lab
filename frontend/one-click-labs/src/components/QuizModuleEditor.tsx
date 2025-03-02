"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  QuizModule,
  QuizQuestion,
  QuizOption,
  createQuizQuestion,
  createQuizOption,
} from "@/types/models";

interface QuizModuleEditorProps {
  module: QuizModule;
  onChange: (updatedModule: QuizModule) => void;
}

export default function QuizModuleEditor({
  module,
  onChange,
}: QuizModuleEditorProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(module.title || "");
  const [questions, setQuestions] = useState<QuizQuestion[]>(module.questions || []);
  const [showPreview, setShowPreview] = useState(false);
  const [userResponses, setUserResponses] = useState<Record<string, string[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState<{ points: number; total: number }>({
    points: 0,
    total: 0,
  });

  // Update module when title or questions change
  useEffect(() => {
    onChange({
      ...module,
      title,
      questions,
    });
  }, [title, questions]);

  // Add a new question
  const addQuestion = () => {
    const newQuestion = createQuizQuestion();
    setQuestions([...questions, newQuestion]);
  };

  // Update a question
  const updateQuestion = (updatedQuestion: QuizQuestion) => {
    setQuestions(
      questions.map((q) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
  };

  // Remove a question
  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  // Handle user responses in the preview mode
  const handleResponseChange = (questionId: string, optionIds: string[]) => {
    setUserResponses({
      ...userResponses,
      [questionId]: optionIds,
    });
  };

  // Calculate score when quiz is submitted
  const handleSubmitQuiz = () => {
    let earnedPoints = 0;
    let totalPoints = 0;

    questions.forEach((question) => {
      totalPoints += question.points;

      // Get user's selected options for this question
      const selectedOptionIds = userResponses[question.id] || [];
      
      // For multiple-answer questions, all correct options must be selected
      // and no incorrect options should be selected
      if (question.type === 'multiple-answer') {
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
          // If any incorrect option is selected, award 0 points
          earnedPoints += 0;
        } else {
          // Count how many correct options the user selected
          const correctSelectedCount = selectedOptionIds.filter(id => 
            correctOptionIds.includes(id)
          ).length;
          
          // Calculate partial points based on ratio of correct answers selected
          if (correctOptionIds.length > 0 && correctSelectedCount > 0) {
            const partialPoints = question.points * (correctSelectedCount / correctOptionIds.length);
            earnedPoints += partialPoints;
          }
        }
      }
    });

    setScore({
      points: Math.round(earnedPoints * 100) / 100, // Round to 2 decimal places
      total: totalPoints,
    });
    
    setQuizSubmitted(true);
  };

  // Reset the quiz preview
  const resetQuiz = () => {
    setUserResponses({});
    setQuizSubmitted(false);
    setScore({ points: 0, total: 0 });
  };

  // Toggle between edit and preview modes
  const togglePreview = () => {
    setShowPreview(!showPreview);
    resetQuiz();
  };

  // Prevent event bubbling for all click events inside the quiz editor
  const handleEditorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="bg-card rounded-lg p-4 shadow-sm border border-border-color"
      onClick={handleEditorClick}
    >
      {/* Module title input */}
      <div className="mb-4">
        <label htmlFor="module-title" className="block text-sm font-medium mb-1 text-foreground">
          Quiz Title
        </label>
        <input
          id="module-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border-color rounded-md bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
          placeholder="Enter a title for this quiz"
          disabled={showPreview}
        />
      </div>

      {/* Toggle between Edit and Preview modes */}
      <div className="mb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePreview();
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          {showPreview ? "Edit Quiz" : "Preview Quiz"}
        </button>
      </div>

      {/* Main content: either Quiz Editor or Quiz Preview */}
      {showPreview ? (
        <QuizPreview
          questions={questions}
          userResponses={userResponses}
          onResponseChange={handleResponseChange}
          onSubmit={handleSubmitQuiz}
          quizSubmitted={quizSubmitted}
          score={score}
          onReset={resetQuiz}
        />
      ) : (
        <>
          {/* Questions list */}
          <div className="space-y-6 mb-6">
            {questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                questionIndex={index}
                onChange={updateQuestion}
                onRemove={() => removeQuestion(question.id)}
              />
            ))}
          </div>

          {/* Add question button */}
          <div className="mt-4">
            <button
              onClick={addQuestion}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md border border-border-color"
            >
              + Add Question
            </button>
          </div>
        </>
      )}

      {/* Quiz data debug section */}
      <div className="mt-8 p-3 bg-secondary rounded-md border border-border-color">
        <h3 className="font-medium text-sm mb-2 text-foreground">Quiz Data:</h3>
        <pre className="text-xs overflow-auto max-h-32 p-2 bg-card border border-border-color rounded text-foreground/90">
          {JSON.stringify({ title, questions }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// Question Editor Sub-component
interface QuestionEditorProps {
  question: QuizQuestion;
  questionIndex: number;
  onChange: (question: QuizQuestion) => void;
  onRemove: () => void;
}

function QuestionEditor({
  question,
  questionIndex,
  onChange,
  onRemove,
}: QuestionEditorProps) {
  // Update question text
  const updateQuestionText = (text: string) => {
    onChange({ ...question, text });
  };

  // Add a new option
  const addOption = () => {
    const newOption = createQuizOption();
    onChange({
      ...question,
      options: [...(question.options || []), newOption],
    });
  };

  // Update an option
  const updateOption = (optionId: string, text: string, isCorrect: boolean) => {
    onChange({
      ...question,
      options: question.options?.map((opt) =>
        opt.id === optionId ? { ...opt, text, isCorrect } : opt
      ),
    });
  };

  // Remove an option
  const removeOption = (optionId: string) => {
    onChange({
      ...question,
      options: question.options?.filter((opt) => opt.id !== optionId),
    });
  };

  return (
    <div className="border border-border-color rounded-md p-4 bg-background shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg text-foreground">Question {questionIndex + 1}</h3>
        <button
          onClick={onRemove}
          className="px-2 py-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          aria-label="Remove question"
        >
          Remove
        </button>
      </div>

      {/* Question text */}
      <div className="mb-4">
        <label
          htmlFor={`question-${question.id}`}
          className="block text-sm font-medium mb-1 text-foreground"
        >
          Question Text
        </label>
        <input
          id={`question-${question.id}`}
          type="text"
          value={question.text}
          onChange={(e) => updateQuestionText(e.target.value)}
          className="w-full px-3 py-2 border border-border-color rounded-md bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
          placeholder="Enter the question"
        />
      </div>

      {/* Options */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-foreground">
          Answer Options (Check all correct answers)
        </label>
        <div className="space-y-2">
          {question.options?.map((option) => (
            <div
              key={option.id}
              className="flex items-center space-x-2 border border-border-color rounded-md p-2 bg-card hover:border-primary/60 transition-colors shadow-sm"
            >
              <input
                type="checkbox"
                id={`option-${option.id}`}
                checked={option.isCorrect}
                onChange={(e) =>
                  updateOption(option.id, option.text, e.target.checked)
                }
                className="h-4 w-4 text-primary focus:ring-primary focus:ring-offset-background"
              />
              <input
                type="text"
                value={option.text}
                onChange={(e) =>
                  updateOption(option.id, e.target.value, option.isCorrect || false)
                }
                className="flex-grow px-3 py-1 bg-transparent border border-border-color/30 focus:border-primary rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter answer option"
              />
              <button
                onClick={() => removeOption(option.id)}
                className="px-2 py-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                aria-label="Remove option"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addOption}
          className="mt-2 px-3 py-1 text-sm border border-border-color rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
        >
          + Add Option
        </button>
      </div>

      {/* Points */}
      <div className="mb-2">
        <label
          htmlFor={`points-${question.id}`}
          className="block text-sm font-medium mb-1 text-foreground"
        >
          Points
        </label>
        <input
          id={`points-${question.id}`}
          type="number"
          min="1"
          value={question.points}
          onChange={(e) =>
            onChange({ ...question, points: parseInt(e.target.value) || 1 })
          }
          className="px-3 py-1 border border-border-color rounded-md bg-background w-20 text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
        />
      </div>
    </div>
  );
}

// Quiz Preview Sub-component
interface QuizPreviewProps {
  questions: QuizQuestion[];
  userResponses: Record<string, string[]>;
  onResponseChange: (questionId: string, optionIds: string[]) => void;
  onSubmit: () => void;
  quizSubmitted: boolean;
  score: { points: number; total: number };
  onReset: () => void;
}

function QuizPreview({
  questions,
  userResponses,
  onResponseChange,
  onSubmit,
  quizSubmitted,
  score,
  onReset,
}: QuizPreviewProps) {
  const allQuestionsAnswered = questions.every(
    (q) => userResponses[q.id] && userResponses[q.id].length > 0
  );

  return (
    <div className="space-y-6">
      {/* Results section (if submitted) */}
      {quizSubmitted && (
        <div className={`p-4 rounded-md mb-6 border ${
          score.points === score.total
            ? "bg-green-100/20 border-green-500/30 text-green-600 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50"
            : score.points > score.total / 2
            ? "bg-yellow-100/20 border-yellow-500/30 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50"
            : "bg-red-100/20 border-red-500/30 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50"
        }`}>
          <h3 className="font-bold text-lg mb-2">Quiz Results</h3>
          <p>
            You scored {score.points.toFixed(2)} out of {score.total} points (
            {Math.round((score.points / (score.total || 1)) * 100)}%)
          </p>
          <button
            onClick={onReset}
            className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Questions */}
      {questions.map((question, index) => (
        <div
          key={question.id}
          className="border border-border-color rounded-md p-4 bg-background shadow-sm"
        >
          <h3 className="font-medium text-lg mb-4 text-foreground">
            {index + 1}. {question.text}
            <span className="text-sm text-gray-500 ml-2">({question.points} points)</span>
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {question.options?.map((option) => {
              const isSelected = userResponses[question.id]?.includes(option.id) || false;
              
              // Determine styling based on submission status
              let optionClasses = "p-3 rounded-md border shadow-sm transition-colors ";
              
              if (quizSubmitted) {
                if (option.isCorrect && isSelected) {
                  // Correct answer selected
                  optionClasses += "bg-green-100/30 border-green-500/50 dark:bg-green-900/30 dark:border-green-600/50";
                } else if (option.isCorrect) {
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
                  onClick={() => {
                    if (!quizSubmitted) {
                      const currentSelections = userResponses[question.id] || [];
                      
                      // For checkbox-like behavior (multi-selection)
                      const newSelections = currentSelections.includes(option.id)
                        ? currentSelections.filter(id => id !== option.id)
                        : [...currentSelections, option.id];
                        
                      onResponseChange(question.id, newSelections);
                    }
                  }}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
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
                    {quizSubmitted && option.isCorrect && (
                      <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {quizSubmitted && question.explanation && (
            <div className="mt-3 p-3 bg-blue-50/20 border border-blue-500/30 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50 rounded">
              <p className="text-sm"><strong>Explanation:</strong> {question.explanation}</p>
            </div>
          )}

          {/* Add explanation about partial marking if there are multiple correct answers */}
          {!quizSubmitted && question.options && 
           question.options.filter(o => o.isCorrect).length > 1 && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
              Note: Partial marks are awarded for selecting some but not all correct answers.
              Selecting any incorrect answer will result in zero marks.
            </div>
          )}
        </div>
      ))}

      {/* Submit button */}
      {!quizSubmitted && (
        <button
          onClick={onSubmit}
          disabled={!allQuestionsAnswered || questions.length === 0}
          className={`px-4 py-2 rounded transition-colors ${
            allQuestionsAnswered && questions.length > 0
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          Submit Quiz
        </button>
      )}
    </div>
  );
}
