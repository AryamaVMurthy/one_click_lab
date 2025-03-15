# One Click Labs - Create Interactive Virtual Labs in Seconds!

## Features
OneClickLabs

Zero-Code Interface: AI-powered lab creation with an intuitive UI

Create a Lab in < 1 Minute: Fast setup for interactive virtual labs

AI-Powered Content & Simulation Generation: Smart automation for lab structuring

Realistic Simulations: Enhances the learning experience

Easy Deployment: One-click cloud deployment with no manual configuration

## Getting Started

### Backend:

1. Navigate to the backend directory, install packages and run server:
```bash
cd backend
add .env file with MONGODB_URL, DATABASE_NAME, OPENAI_API_KEY, ANTHROPIC_API_KEY, GITHUB_TOKEN
pip install -r requirements.txt
uvicorn main:app --reload

cd ai_text_gen
add .env file with MONGODB_URL, DATABASE_NAME, OPENAI_API_KEY, ANTHROPIC_API_KEY, GITHUB_TOKEN
pip install -r requirements.txt
py server.py
```
### Frontend:
1. Navigate to the frontend directory:
```bash
cd frontend/one-click-labs
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
