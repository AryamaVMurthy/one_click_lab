# One Click Labs – Backend API Specification

This document lists the exact specifications for the FastAPI backend. It describes the expected request types, response types, the fields that must be stored in MongoDB, and additional deployment requirements (such as AWS S3 uploads) for each API endpoint. Do not include sample code – only the specifications.

---

## Table of Contents
1. [API Endpoint Specification](#api-endpoint-specification)
2. [MongoDB Storage Specifications](#mongodb-storage-specifications)
3. [Deployment Requirements (AWS Integration)](#deployment-requirements-aws-integration)
4. [Additional Considerations](#additional-considerations)

---

## 1. API Endpoint Specification

All endpoints are prefixed with `/api/v1/`.

### 1.1 Authentication Endpoints
- **Login**  
  - **Request Type:** POST  
  - **Request Body:**  
    - `email`: string  
    - `password`: string  
  - **Response:**  
    - `success`: boolean  
    - `data`: `{ token: string, refreshToken: string, user: { id, name, email, role } }`  
    - `error`: string (if failure)

- **Register**  
  - **Request Type:** POST  
  - **Request Body:**  
    - `name`: string  
    - `email`: string  
    - `password`: string  
  - **Response:**  
    - `success`: boolean  
    - `data`: user object `{ id, name, email, role }`  
    - `error`: string

- **Token Refresh & Logout**  
  - **Request Type:** POST  
  - **Request Body:**: refresh token for refresh; no body for logout  
  - **Response:** Similar structure with updated tokens or confirmation of logout.

---

### 1.2 Lab Management Endpoints

#### Create Lab
- **Endpoint:** POST `/api/v1/labs`
- **Expected Request Body:**  
  - `title`: string  
  - `description`: string  
  - `author`: `{ id: string, name: string, email: string }`
- **Expected Response Type:**  
  - `success`: true  
  - `data`: Lab document with fields listed below  
  - `error`: string if failure

#### Get Lab
- **Endpoint:** GET `/api/v1/labs/{id}`
- **Expected Response Type:**  
  - `success`: true  
  - `data`: A lab object (see MongoDB structure below)  
  - `error`: string if lab not found

#### Update Lab
- **Endpoint:** PUT `/api/v1/labs/{id}`
- **Expected Request Body:**  
  - Any updatable field: `title`, `description`, and an updated array of `sections`  
  - Timestamps should be updated (e.g. `updatedAt`)
- **Expected Response Type:**  
  - `success`: true  
  - `data`: Updated lab object  
  - `error`: string if update fails

#### Delete Lab
- **Endpoint:** DELETE `/api/v1/labs/{id}`
- **Expected Response Type:**  
  - `success`: true  
  - `error`: string if deletion fails

#### Get All Labs
- **Endpoint:** GET `/api/v1/labs`
- **Query Parameters:**  
  - `page`: integer (default 1)  
  - `limit`: integer (default 10)  
  - `status`: "all", "draft", "published"  
  - `search`: string (optional)
- **Expected Response Type:**  
  - `success`: true  
  - `data`: An object containing:  
    - `labs`: array of lab objects  
    - `total`: integer  
    - `page`: integer  
    - `limit`: integer  
    - `totalPages`: integer  
  - `error`: string

---

### 1.3 Lab Deployment Endpoint

#### Deploy Lab
- **Endpoint:** POST `/api/v1/labs/{id}/deploy`
- **Expected Behavior:**
  - Validate the lab exists.
  - Generate an HTML export of the lab using its stored content.
  - Upload generated HTML (and its assets if any) to a dedicated S3 bucket path such as `/labs/{lab-id}/{version}/index.html`.
  - Optionally update CloudFront cache invalidation.
  - Update the lab document in MongoDB with deployment info.
- **Expected Response Type:**  
  - `success`: true  
  - `data`: `{ deploymentUrl: string, deployedVersion: string }`  
  - `error`: string if failure

---

### 1.4 AI Content Generation Endpoints

#### Generate Text Content
- **Endpoint:** POST `/api/v1/ai/generate-text`
- **Expected Request Body:**  
  - `topic`: string  
  - `contentType`: one of "introduction", "explanation", "summary"  
  - `keywords`: array of strings (optional)  
  - `targetLength`: one of "short", "medium", "long"  
  - `tone`: one of "formal", "casual", "technical"  
  - `context`: string (optional)
- **Expected Response Type:**  
  - `success`: true  
  - `data`: `{ content: string }` (the response is HTML-formatted content)  
  - `error`: string

#### Generate Quiz
- **Endpoint:** POST `/api/v1/ai/generate-quiz`
- **Expected Request Body:**  
  - `topic`: string  
  - `numQuestions`: number  
  - `difficulty`: one of "easy", "medium", "hard"  
  - `contentReference`: string (optional, reference text)
- **Expected Response Type:**  
  - `success`: true  
  - `data`: `{ questions: QuizQuestion[] }` where each question includes:
    - `text`: string  
    - `options`: array of objects (`{ text: string, isCorrect: boolean }`)  
    - `explanation`: string  
    - `points`: number  
  - `error`: string

---

## 2. MongoDB Storage Specifications

### Lab Document Fields (to be stored in the Labs collection)
- `id`: string (UUID)
- `title`: string
- `description`: string
- `sections`: array of Section objects  
  Each Section includes:
  - `id`: string (UUID)
  - `title`: string
  - `order`: number
  - `modules`: array of Module objects
    - For text modules: store `content` (HTML string), optional `title`, `order`
    - For quiz modules: store `questions` (each with `id`, `text`, `type`, `options` (each with `id`, `text`, `isCorrect`), `explanation`, `points`), optional `passingScore`, `title`, `order`
    - For image modules: store `url`, optional `altText`, `caption`
    - For video modules: store `url`, `provider` (e.g., youtube, vimeo, custom), optional `caption`
- `status`: string ("draft" or "published")
- `author`: object with `id`, `name`, and optionally `email`
- `createdAt`: ISO date string
- `updatedAt`: ISO date string
- `isPublished`: boolean
- `publishedAt`: ISO date string (if published)
- `deploymentUrls`: object containing:
  - `latest`: string (URL)  
  - `versions`: array of objects `{ version: string, url: string, deployedAt: ISO date string }`

### User Document Fields (if implementing authentication)
- `id`: string (UUID)
- `name`: string
- `email`: string
- `passwordHash`: string
- `role`: string (e.g., "admin", "creator", "student")
- `createdAt`: ISO date string
- `updatedAt`: ISO date string

---

## 3. Deployment Requirements (AWS Integration)

- **S3 Bucket Configuration:**
  - Create a dedicated S3 bucket (e.g., `one-click-labs-deployments`) for hosting static lab exports.
  - Configure it for static website hosting and set proper CORS policies.
  - Set bucket policies for public read access of the exported labs.

- **CloudFront Integration:**
  - Set up a CloudFront distribution (if required) pointing to the S3 bucket.
  - Configure cache invalidation upon new deployments.
  - Optionally use a custom domain with Route 53.

- **Deployment Process in API:**
  1. When the deploy endpoint is called, generate the lab HTML export based on the stored lab data.
  2. Upload the HTML file (and any additional asset files) to a path in S3 formatted as `/labs/{lab-id}/{version}/index.html`.
  3. Update the lab document in MongoDB with the new deployment URL and version details.
  4. If a CloudFront distribution is in use, programmatically trigger an invalidation to update the cache.
  5. Return the deployment URL and version in the API response.

---

## 4. Additional Considerations

- **Error Handling:**  
  Each endpoint must return a clear error message when operations fail.

- **Data Validation:**  
  Validate all incoming request parameters and request bodies. Use proper data models for requests and responses.

- **Security:**  
  Implement JWT-based authentication to protect API endpoints. Validate user roles for operations such as updating or deploying labs.

- **Logging and Monitoring:**  
  Maintain logs for API activity and errors. Use integrated monitoring for deployment processes.

- **Testing & Quality Assurance:**  
  Write unit and integration tests for all endpoints, including simulation of AWS deployments and AI API error scenarios.

- **Documentation:**  
  Keep the API documentation updated with request/response schemas and include sample error messages (without including sample code).

---

This specification describes the exact requirements for API request/response types, MongoDB document structures, and deployment flows necessary for the backend of One Click Labs.
