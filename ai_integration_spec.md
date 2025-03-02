# AI Integration Specification for One Click Labs

This document details the plan for integrating AI features into One Click Labs, with automatic generation and iterative refinement of quizzes and text modules as well as AI‐assisted autocompletion in text editing. The plan covers both backend API design and frontend integration.

---

## Table of Contents
1. Overview
2. Automatic Generation of Quizzes and Text Content
   - 2.1 API Endpoints
   - 2.2 Request/Response Specifications
3. Iterative Refinement Workflow
4. AI Assisted Autocompletion in Text Module Editor
5. Frontend Integration
6. Additional Considerations

---

## 1. Overview

As an AI engineer, your objective is to leverage AI (e.g., using OpenAI GPT‑4) for:
- **Automatic Content Generation:**  
  Auto-create quiz questions and text content (introduction, explanation, summary) for modules.
- **Iterative Refinement:**  
  Allow users to refine the generated content interactively.
- **Autocompletion:**  
  Enable AI‐assisted autocompletion during text module editing.

All AI features will be exposed through dedicated backend API endpoints and then integrated into the frontend editor.

---

## 2. Automatic Generation of Quizzes and Text Content

### 2.1 API Endpoints

Introduce new endpoints under the `/api/v1/ai/` namespace.

- **Endpoint for Text Content Generation:**  
  `POST /api/v1/ai/generate-text`  
  This endpoint takes a topic and various parameters (content type, tone, target length, keywords) and returns HTML-formatted text.

- **Endpoint for Quiz Generation:**  
  `POST /api/v1/ai/generate-quiz`  
  This endpoint accepts inputs such as topic, number of questions, difficulty, and optional reference content; it returns a set of quiz questions formatted as JSON.

### 2.2 Request/Response Specifications

#### Generate Text Content Request
- **Request Body:**  
  ```json
  {
    "topic": "string",
    "contentType": "introduction" | "explanation" | "summary",
    "keywords": ["string"],
    "targetLength": "short" | "medium" | "long",
    "tone": "formal" | "casual" | "technical",
    "context": "string"
  }
  ```
- **Response:**  
  ```json
  {
    "success": true,
    "data": {
      "content": "HTML string with formatted text"
    },
    "error": "string if any"
  }
  ```

#### Generate Quiz Request
- **Request Body:**  
  ```json
  {
    "topic": "string",
    "numQuestions": number,
    "difficulty": "easy" | "medium" | "hard",
    "contentReference": "string"
  }
  ```
- **Response:**  
  ```json
  {
    "success": true,
    "data": {
      "questions": [
        {
          "text": "string",
          "options": [
            { "text": "string", "isCorrect": boolean }
          ],
          "explanation": "string",
          "points": number
        }
      ]
    },
    "error": "string if any"
  }
  ```

*Note: These endpoints will call the OpenAI API internally and handle errors gracefully.*

---

## 3. Iterative Refinement Workflow

To enable iterative refinement, design the workflow as follows:

- **Initial Generation:**  
  User presses a “Generate” button; the frontend calls the respective endpoint (text or quiz generation). The response is presented in an editor or a preview panel.

- **User Feedback:**  
  Users can edit or mark the generated content as unsatisfactory. They may then click a “Refine” button.

- **Refinement Request:**  
  The “Refine” action sends the current content along with user feedback (or revised prompt parameters) back to the same endpoint with an added property (e.g., `"refine": true` and `"previousContent": "..."`).  
  The backend uses this context for generating improved content.

- **Iteration Loop:**  
  Repeat the process as needed until the user is satisfied and then save the refined version in the module.

---

## 4. AI Assisted Autocompletion in Text Module Editor

- **Integration Approach:**  
  In the text module editor (already existing in the frontend), integrate an AI autocompletion service.
  
- **Autocompletion Trigger:**  
  When a user types in the editor, detect pause (debounce mechanism) and send the current text snippet to an autocompletion API endpoint.

- **API Design:**  
  You may add a new endpoint such as:  
  `POST /api/v1/ai/autocomplete`  
  **Request Body:**  
  ```json
  {
    "context": "current text around the cursor",
    "prompt": "user-specified additional context (optional)"
  }
  ```
  **Response:**  
  ```json
  {
    "success": true,
    "data": {
      "completion": "string"
    },
    "error": "string if any"
  }
  ```

- **Frontend Integration:**  
  Use a text editor component (such as a CodeMirror or Monaco integration) that supports asynchronous suggestions. Display the autocompletion suggestions inline and allow the user to accept or modify the suggestions.

---

## 5. Frontend Integration

### Integrating Generated Content in the Frontend
- **Quiz and Text Generation Buttons:**  
  Add buttons in the respective module editors (TextModuleEditor and QuizModuleEditor) to “Generate” or “Refine” content.
  
- **Display Panel:**  
  When a generation request is made, show a loading indicator; on completion, display the generated HTML (for text) or the generated quiz question preview.
  
- **Editor Autocompletion Plugin:**  
  In the text editor, integrate a plugin that on key-up (with debouncing) calls the autocompletion endpoint and shows suggestions.

### Handling Iterative Refinement
- Pass the previous version of the content along with new prompt edits.
- A “Refine” button triggers a new API call with the current text as context.
- Update the module editor with the refined content once generated.

### Communication Flow Diagram
- Frontend button click → API call to `/api/v1/ai/generate-*` endpoint.
- API processes request using OpenAI and returns content.
- Frontend displays result in editor and offers “Refine” option.
- For autocompletion: as user types → debounce → API call to `/api/v1/ai/autocomplete` → display suggestion → user accepts suggestion → update text content.

---

## 6. Additional Considerations

- **Caching:**  
  Consider caching generated results to reduce API calls for repeated prompts.

- **Error Handling:**  
  Both endpoints must return meaningful error messages and the frontend should gracefully handle errors (e.g., display a toast message).

- **Rate Limiting:**  
  Keep track of API usage since AI calls may be expensive; implement rate limiting as necessary.

- **Security:**  
  Validate inputs in both backend and frontend to prevent injection attacks.

- **User Experience:**  
  Ensure that the interface clearly indicates loading states, allows cancellation of requests, and provides an intuitive way to refine content.

- **Testing:**  
  Test the integration using both unit tests (simulate API responses) and end-to-end tests (simulate complete user interactions).

---

This detailed specification should guide the AI integration process into the backend and frontend of One Click Labs, ensuring that AI-generated quizzes and text content, as well as AI-assisted autocompletion in text modules, are effectively implemented with iterative refinement capability.
