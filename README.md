# Blu Visual Teacher

A local, offline-first visual lesson studio that generates illustrated lessons with narration, captions, and exportable MP4 video — powered by a local Ollama model (`llama3.2`) and local TTS (VITS/MMS) for English, Hindi, and Kannada.

## Features

- **Local LLM**: Lesson generation through Ollama `llama3.2` (no cloud API keys required)
- **Local TTS**: Offline text-to-speech via Hugging Face MMS-VITS models (en / hi / kn)
- **Visual lessons**: Auto-generated scenes (title cards, bullet reveals, step sequences) with synchronized narration
- **Video export**: Renders lessons to MP4 with synchronized captions (SRT/VTT)
- **Quiz**: AI-generated multiple-choice quizzes from lesson content
- **Notes**: Persistent per-lesson notes
- **Multilingual**: English, Hindi, and Kannada support

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript (tsx)
- **LLM**: Ollama (`llama3.2:latest`, 3.2B)
- **TTS**: PyTorch + Transformers + VitsModel (MMS-TTS eng/hin/kan)
- **Video**: Playwright (Chromium frame capture) + FFmpeg (MP4 encoding)
- **Validation**: Zod schemas

## Project Structure

```
blu-visual-teacher/
├── server/              # Express API server
│   ├── index.ts         # Main server + API routes
│   ├── media.ts         # TTS, audio assembly, exports
│   ├── render.ts        # Playwright + FFmpeg video rendering
│   ├── render-page.ts   # Server-side render preview HTML
│   ├── process.ts       # Child process runner
│   └── storage.ts       # File storage helpers
├── src/                 # React frontend
│   ├── App.tsx          # App shell + video player
│   ├── lib/api.ts       # API client
│   └── components/
│       ├── App.tsx
│       ├── LeftPanel.tsx   # Lesson generation controls
│       ├── RightPanel.tsx  # Export / Quiz / Notes tabs
│       ├── Stage.tsx       # Visual canvas + audio playback
│       ├── Quiz.tsx        # Quiz component
│       └── Notes.tsx       # Notes component
├── shared/              # Shared Zod schemas + types
│   ├── schema.ts
│   └── timeline.ts
├── python/              # TTS inference script
│   ├── tts.py
│   └── requirements.txt
├── data/                # Lessons, TTS models, exports, cache
├── .env                 # Runtime config (OLLAMA_MODEL, etc.)
└── package.json
```

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+ with `venv`
- [Ollama](https://ollama.ai) installed and running with `llama3.2` pulled
- FFmpeg (bundled via `ffmpeg-static`)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Python TTS environment

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
# or
source .venv/bin/activate  # macOS/Linux

pip install -r python/requirements.txt
```

TTS models (`mms-tts-eng`, `mms-tts-hin`, `mms-tts-kan`) should be present in `data/models/`.

### 3. Configure environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` if needed — defaults point to Ollama at `http://127.0.0.1:11434` with model `llama3.2`.

### 4. Start Ollama

Make sure Ollama is running and the model is available:

```bash
ollama serve
ollama pull llama3.2
```

### 5. Start the app

```bash
npm run dev
```

- API server: `http://127.0.0.1:3001`
- Frontend: `http://127.0.0.1:5173`

### 6. Use the app

1. **Generate**: Enter a topic, click "Generate lesson" — Ollama creates scenes with narration
2. **Render**: Click "Render" — TTS generates audio, Playwright captures frames, FFmpeg encodes MP4
3. **Watch**: The video player appears when rendering completes — click play
4. **Quiz**: Switch to the Quiz tab, generate questions, answer, and get scored
5. **Notes**: Switch to the Notes tab, write takeaways, save them per lesson

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `127.0.0.1` | API bind host |
| `PORT` | `3001` | API bind port |
| `VITE_ORIGIN` | `http://127.0.0.1:5173` | Frontend origin for CORS |
| `LLM_PROVIDER` | `ollama` | LLM provider |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model name |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Ollama server URL |
| `PYTHON_PATH` | `.venv/Scripts/python.exe` | Python executable for TTS |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctor` | Service health (Ollama, TTS, FFmpeg) |
| POST | `/api/lessons/generate` | Generate a lesson from topic/level/lang |
| GET | `/api/lessons/:id` | Get a lesson |
| PUT | `/api/lessons/:id` | Update a lesson |
| POST | `/api/lessons/:id/render` | Render lesson to MP4 |
| GET | `/api/lessons/:id/exports` | List export formats |
| GET | `/api/exports/:id/download` | Download export file |
| POST | `/api/lessons/:id/quiz` | Generate quiz from lesson |
| GET | `/api/lessons/:id/quiz` | Get quiz for lesson |
| POST | `/api/notes` | Save notes for lesson |
| GET | `/api/notes/:lesson_id` | Get notes for lesson |
| GET | `/api/jobs/:id` | Job status (generation/render) |

## License

MIT
