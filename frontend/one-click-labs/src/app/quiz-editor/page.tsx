"use client";

import { useState } from 'react';
import {
  QuizModule,
  createQuizModule,
  createQuizQuestion,
  createQuizOption
} from '@/types/models';
import QuizModuleEditor from '@/components/QuizModuleEditor';
import { useTheme } from '@/context/ThemeContext';

export default function QuizEditorPage() {
  const { theme } = useTheme();
  
  // Create initial sample module with content
  const [module, setModule] = useState<QuizModule>(
    createQuizModule({
      title: 'Example Quiz',
      questions: [
        createQuizQuestion({
          text: 'Which of the following are JavaScript frameworks?',
          type: 'multiple-answer',
          points: 2,
          explanation: 'React, Vue and Angular are all popular JavaScript frameworks, while Python is a programming language.',
          options: [
            createQuizOption({ text: 'React', isCorrect: true }),
            createQuizOption({ text: 'Python', isCorrect: false }),
            createQuizOption({ text: 'Angular', isCorrect: true }),
            createQuizOption({ text: 'Vue', isCorrect: true })
          ]
        }),
        createQuizQuestion({
          text: 'Which of these data types exist in JavaScript?',
          type: 'multiple-answer',
          points: 2,
          options: [
            createQuizOption({ text: 'String', isCorrect: true }),
            createQuizOption({ text: 'Integer', isCorrect: false }),
            createQuizOption({ text: 'Boolean', isCorrect: true }),
            createQuizOption({ text: 'Object', isCorrect: true })
          ]
        })
      ]
    })
  );

  // Handle module changes
  const handleModuleChange = (updatedModule: QuizModule) => {
    setModule(updatedModule);
    console.log('Module updated:', updatedModule);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Quiz Module Editor Demo</h1>
      
      <div className="mb-8">
        <QuizModuleEditor 
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
