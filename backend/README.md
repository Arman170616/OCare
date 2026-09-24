# OmanCare FastAPI backend

This backend uses SQLite and FastAPI to serve the project catalog, donation data, and impact stats for the React frontend.

## Run locally

1. Install Python dependencies:
   pip install -r backend/requirements.txt
2. Start the API:
   npm run dev:backend
3. Start the frontend:
   npm run dev:frontend

The frontend will proxy `/api/*` requests to `http://127.0.0.1:8000` automatically.
