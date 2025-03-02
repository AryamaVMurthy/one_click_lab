"use client";

import { useState } from 'react';
import { Section, createSection, createTextModule, createQuizModule, createQuizQuestion, createQuizOption } from '@/types/models';
import SectionEditor from '@/components/SectionEditor';

export default function SectionEditorDemoPage() {
  // Sample data for demonstration
  const [sections, setSections] = useState<Section[]>([
    createSection({
      title: 'Introduction to React',
      modules: [
        createTextModule({
          title: 'What is React?',
          content: '<h2>Introduction to React</h2><p>React is a JavaScript library for building user interfaces. It was developed by Facebook and is widely used for single-page applications.</p>',
          order: 0
        }),
        createQuizModule({
          title: 'React Fundamentals Quiz',
          order: 1,
          questions: [
            createQuizQuestion({
              text: 'Which of the following is true about React?',
              type: 'multiple-answer',
              points: 2,
              options: [
                createQuizOption({ text: 'React is a JavaScript library', isCorrect: true }),
                createQuizOption({ text: 'React is a full-stack framework', isCorrect: false }),
                createQuizOption({ text: 'React focuses on UI components', isCorrect: true }),
                createQuizOption({ text: 'React was developed by Google', isCorrect: false })
              ]
            })
          ]
        })
      ]
    })
  ]);

  // Add a new section
  const handleAddSection = () => {
    const newSection = createSection({
      title: 'New Section',
      order: sections.length
    });
    setSections([...sections, newSection]);
  };

  // Update a section
  const handleUpdateSection = (updatedSection: Section, index: number) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };

  // Delete a section
  const handleDeleteSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Section Editor Demo</h1>
      </div>

      {sections.length > 0 ? (
        <div className="space-y-8">
          {sections.map((section, index) => (
            <SectionEditor
              key={section.id}
              section={section}
              onChange={(updatedSection) => handleUpdateSection(updatedSection, index)}
              onDelete={() => handleDeleteSection(index)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-card border border-dashed border-border-color rounded-lg">
          <p className="text-lg text-secondary-foreground mb-4">No sections yet</p>
          <button
            onClick={handleAddSection}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors"
          >
            Create Your First Section
          </button>
        </div>
      )}

      {/* Debug information */}
      {sections.length > 0 && (
        <div className="mt-12 p-4 border border-border-color rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-2">Section Data:</h2>
          <pre className="bg-secondary p-4 rounded overflow-auto text-xs max-h-96">
            {JSON.stringify(sections, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
