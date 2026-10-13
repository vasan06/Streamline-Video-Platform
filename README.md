# Streamline — Video Streaming Platform

A small full-stack video streaming platform: Next.js frontend, Python (FastAPI) backend,
ffmpeg-based HLS transcoding (480p/720p/1080p adaptive bitrate), JWT auth with
admin/user roles, and an admin dashboard with user activity analytics.

## Project structure

```
backend/
  app/
    main.py            - FastAPI app entrypoint
    config.py          - settings (env vars)
    database.py        - SQLAlchemy session/engine
    auth_utils.py       - JWT + password hashing + role guards
    schemas.py          - Pydantic request/response models
    models/             - User, Video, WatchLog, Favorite
    routes/             - auth, videos, uploads, analytics
    services/
      ffmpeg_service.py     - HLS transcoding via ffmpeg
      storage_service.py    - local disk storage (Supabase-ready)
      analytics_service.py  - admin analytics queries
  requirements.txt
  .env.example

frontend/
  src/
    app/                - pages (browse, login, video watch, history,
                          favorites, admin dashboard, admin upload)
    components/         - VideoPlayer (hls.js), VideoCard, Sidebar,
                          SearchBar, UploadForm
    services/           - api client, auth, video
    context/            - AuthContext (JWT session)
    types/              - shared TypeScript types
  .env.example
```

## Running locally

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env if needed (defaults to local SQLite + local file storage)

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at
`http://localhost:8000/docs`.

Notes:
- The **first user who registers automatically becomes an admin**. Register
  your admin account first via the `/login` page (sign-up form) or via
  `POST /auth/register`.
- ffmpeg must be installed and on PATH (`ffmpeg -version` to check).
- Uploaded videos, generated HLS renditions (480p/720p/1080p), and
  thumbnails are stored under `backend/storage/` and served at `/static/...`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# set NEXT_PUBLIC_API_URL to your backend URL (default http://localhost:8000)

npm run dev
```

Visit `http://localhost:3000`.

## Features implemented

- **Auth**: register/login (JWT), roles (`admin` / `user`), first registered
  user becomes admin automatically.
- **Upload & transcoding** (admin only): upload any common video format,
  ffmpeg generates a 480p/720p/1080p HLS ladder + master playlist + thumbnail.
  Processing status (`pending`/`processing`/`ready`/`failed`) is tracked per video.
- **Player**: hls.js adaptive bitrate playback, manual quality selector,
  play/pause, seek bar, volume, timestamps, fullscreen, cinematic view,
  buffering indicator, error/retry state.
- **Browse UI**: left sidebar nav, top search bar, responsive video grid
  with thumbnails and titles.
- **User features**: watch history, favorites, automatic watch-duration
  logging (sent every 10s while playing).
- **Admin dashboard** (`/admin`):
  - Per-video stats: total plays, unique viewers, average watch duration.
  - Per-user activity: videos watched, total watch time, last active.
  - Repeated-plays leaderboard: which user rewatched which video and how
    many times.
  - Video management: delete videos.
- **Security**: passwords hashed with bcrypt, JWT bearer auth, role-based
  route guards (`get_current_admin`), CORS configured, env-based secrets.

## Deploying on free tiers

This project is designed to run on free hosting:

- **Frontend** → Vercel (free tier)
- **Backend** → Render free tier (Python web service)
- **Database** → swap `DATABASE_URL` to a free Postgres instance on
  Neon or Supabase (the app works with SQLite locally and Postgres in
  production without code changes, via SQLAlchemy)
- **Storage** → defaults to local disk (fine for demos on Render's
  ephemeral disk for short-lived testing). For persistence, implement the
  Supabase Storage TODOs in `storage_service.py` (`upload_directory_to_storage`
  and `get_public_url`) and set `SUPABASE_URL`/`SUPABASE_KEY` in `.env`.

## Known limitations / next steps

- Transcoding runs synchronously inside the upload request (fine for small
  demo videos). For production, move `transcode_to_hls` into a background
  worker (Celery/RQ) so uploads return immediately and processing status is
  polled via `/uploads/status/{video_id}`.
- No pagination on video lists / analytics tables — fine for small datasets,
  add `limit`/`offset` for larger libraries.
- Local disk storage is not persistent on most free hosts' ephemeral
  filesystems — use Supabase Storage for production deployments.
