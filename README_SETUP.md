# Project setup (frontend + backend)

This project contains a Vue 3 frontend and a FastAPI backend for a face recognition system.

## Backend setup

1. Create and activate a Python virtual environment (Windows PowerShell):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Copy the example env and customize if needed:

```powershell
copy .env.example .env
# Edit .env to set HOST, PORT, UPLOAD_FOLDER, and CORS_ALLOWED_ORIGINS
```

4. Run the backend:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend setup

1. Install dependencies and run dev server (PowerShell):

```powershell
cd frontend
npm install
npm run dev
```

2. Ensure `frontend/.env` contains `VITE_API_BASE_URL` pointing to your backend, e.g. `VITE_API_BASE_URL=http://localhost:8000`.

## Notes
- Backend `UPLOAD_FOLDER` default is `backend/uploads` (relative to backend folder). Ensure this path is writable.
- For production, set proper CORS origins in `backend/.env`.
- The frontend uses Vite env variables prefixed with `VITE_`.

If you want, I can run a quick local build/dev server checks now and fix any runtime issues.
