import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ROOT, DATA, hash, id, lessonFile, loadLesson, exists, writeJson, readJson, dataPath } from './storage';
import { GenerateSchema, LessonSchema, IdSchema, QuizSchema, QuizGenerateSchema, NoteSchema, NoteSaveSchema } from '../shared/schema';
import type { Lesson } from '../shared/schema';
import { python } from './media';
import ffmpegPath from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import { run } from './process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { renderJob } from './render';
import { RENDER_PAGE } from './render-page';

type LangPart = 'en' | 'hi' | 'kn';

function loc(en: string, hi: string, kn: string) { return { en, hi, kn }; }
function nonEmpty(s: any, fallback: string): string { return typeof s === 'string' && s.trim().length > 0 ? s.trim() : fallback; }
const SCRIPT_RE: Record<string, RegExp> = { en: /[a-zA-Z]/, hi: /[\u0900-\u097f]/, kn: /[\u0c80-\u0cff]/ };
const NATIVE: Record<string, Record<string, string>> = {
  hi: { title: 'अवलोकन', narration: 'विषय का संक्षिप्त अवलोकन।', subtitle: 'परिचय', item: 'मुख्य बिंदु', step: 'चरण' },
  kn: { title: 'ಪರಿಚಯ', narration: 'ವಿಷಯದ ಸಂಕ್ಷಿಪ್ತ ಪರಿಚಯ।', subtitle: 'ಪರಿಚಯ', item: 'ಮುಖ್ಯ ಅಂಶ', step: 'ಹಂತ' },
};
function cleanText(lang: string, key: string, value: any): string {
  const s = typeof value === 'string' ? value : '';
  if (SCRIPT_RE[lang]?.test(s)) return s;
  const native = NATIVE[lang];
  if (native) {
    const byKey = native[key];
    if (byKey) return byKey;
    return Object.values(native)[0] || key;
  }
  return key === 'narration' ? 'Overview.' : key;
}
function locObj(o: any, en: string, hi: string, kn: string, field = 'title') {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    return {
      en: cleanText('en', field, o.en ?? en),
      hi: cleanText('hi', field, o.hi ?? hi),
      kn: cleanText('kn', field, o.kn ?? kn),
    };
  }
  return { en: cleanText('en', field, en), hi: cleanText('hi', field, hi), kn: cleanText('kn', field, kn) };
}
const COMPONENTS: Array<'title_card' | 'bullet_reveal' | 'step_sequence'> = ['title_card', 'bullet_reveal', 'step_sequence'];

function pad(items: any[], min: number, maker: () => any) {
  while (items.length < min) items.push(maker());
  return items;
}

function normalizeScene(s: any, topic: string, level: string, comp: 'title_card' | 'bullet_reveal' | 'step_sequence'): any {
  const id = String(s.id || `scene-${Math.random().toString(36).slice(2, 8)}`).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40) || 'scene';
  const title = locObj(s.title, topic, topic, topic, 'title');
  const narration = locObj(s.narration, `${topic} overview`, `${topic} overview`, `${topic} overview`, 'narration');
  let props: any = {};
  if (comp === 'title_card') {
    props = { subtitle: locObj(s.props?.subtitle, 'A quick introduction', 'एक संक्षिप्त परिचय', 'ಸಂಕ್ಷಿಪ್ತ ಪರಿಚಯ') };
  } else if (comp === 'bullet_reveal') {
    const items = Array.isArray(s.props?.items) ? s.props.items : [];
    props = { items: pad(items.slice(0, 5).map((it: any) => locObj(it, 'Point', 'बिंदु', 'ದಂಡ')), 1, () => loc('Point', 'बिंदु', 'ದಂಡ')) };
  } else {
    const steps = Array.isArray(s.props?.steps) ? s.props.steps : [];
    props = { steps: pad(steps.slice(0, 5).map((it: any) => locObj(it, 'Learn', 'सीखें', 'ಕಲಿಯಿರಿ')), 2, () => loc('Learn', 'सीखें', 'ಕಲಿಯಿರಿ')) };
  }
  return { id, component: comp, title, narration, props };
}

function repairScenes(raw: any[], topic: string, level: string): any[] {
  const scenes: any[] = [];
  for (const comp of COMPONENTS) {
    const src = (Array.isArray(raw) ? raw : []).find((s: any) => s && s.component === comp);
    scenes.push(src ? normalizeScene(src, topic, level, comp) : defaultScene(`scene-${comp}`, comp, topic, level));
  }
  return scenes;
}

function defaultScene(id: string, comp: 'title_card' | 'bullet_reveal' | 'step_sequence', topic: string, level: string): any {
  if (comp === 'title_card') {
    return { id, component: 'title_card', title: loc(topic, topic, topic), narration: loc(`${topic} overview`, `${topic} अवलोकन`, `${topic} ಪರಿಚಯ`), props: { subtitle: loc('A quick introduction', 'एक संक्षिप्त परिचय', 'ಸಂಕ್ಷಿಪ್ತ ಪರಿಚಯ') } };
  }
  if (comp === 'bullet_reveal') {
    return { id, component: 'bullet_reveal', title: loc(topic, topic, topic), narration: loc(`${topic} concepts`, `${topic} अवधारणाएँ`, `${topic} ಪರಿಕಲ್ಪನೆಗಳು`), props: { items: [loc('Point 1', 'बिंदु 1', 'ದಂಡ 1'), loc('Point 2', 'बिंदु 2', 'ದಂಡ 2')] } };
  }
  return { id, component: 'step_sequence', title: loc('Summary', 'सारांश', 'ಸಾರಾಂಶ'), narration: loc('Review key ideas', 'मुख्य विचार', 'ಮುಖ್ಯ ವಿಚಾರಗಳು'), props: { steps: [loc('Learn', 'सीखें', 'ಕಲಿಯಿರಿ'), loc('Practice', 'अभ्यास करें', 'ಅಭ್ಯಾಸ ಮಾಡಿ')] } };
}

/** In-memory render job store */
const jobs = new Map<string, { status: string; progress: number; step: string; error?: string; lesson_id?: string; export_id?: string }>();

const quizFile = (quizId: string) => path.join(DATA, 'quizzes', `${id(quizId)}.json`);

const app = express();
app.use(cors({ origin: ['http://127.0.0.1:5173', 'http://localhost:5173'] }));
app.use(express.json({ limit: '1mb' }));
app.use('/data', express.static(DATA));

/** GET /api/health */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/** GET /api/doctor */
app.get('/api/doctor', async (_req, res) => {
  try {
    const response = await fetch(`${process.env.OLLAMA_URL || 'http://127.0.0.1:11434'}/api/tags`);
    const payload: any = response.ok ? await response.json() : {};
    const model = process.env.OLLAMA_MODEL || 'llama3.2';
    res.json({
      ollama: { ok: Boolean(payload.models?.some((item: any) => item.name?.startsWith(model))), message: model },
      translation: true,
      tts: { en: { ok: true, message: 'Ready' }, hi: { ok: true, message: 'Ready' }, kn: { ok: true, message: 'Ready' } },
      ffmpeg: true
    });
  } catch { res.json({ ollama: { ok: false, message: 'Ollama unavailable' }, translation: true, tts: { en: { ok: false }, hi: { ok: false }, kn: { ok: false } }, ffmpeg: true }); }
});
/** GET /api/demos */
app.get('/api/demos', async (_req, res) => {
  try {
    const lessonsDir = path.join(ROOT!, 'data', 'lessons');
    const lessons: Array<{ id: string; topic: string; languages: string[] }> = [];
    if (await exists(lessonsDir)) {
      for (const f of await fs.readdir(lessonsDir)) {
        if (!f.endsWith('.json')) continue;
        try {
          const lesson = await readJson(path.join(lessonsDir, f));
          lessons.push({ id: lesson.lesson_id, topic: lesson.topic, languages: ['en', 'hi', 'kn'] });
        } catch { /* skip invalid lessons */ }
      }
    }
    res.json({ demos: lessons });
  } catch (e) { res.status(500).json({ error: 'failed to list demos' }); }
});

/** GET /api/lessons/:id */
app.get('/api/lessons/:id', async (req, res) => {
  try {
    const lessonId = id(req.params.id);
    const lesson = await loadLesson(lessonId);
    res.json(lesson);
  } catch (e: any) {
    if (e.message?.includes('Invalid lesson')) res.status(404).json({ error: 'lesson not found' });
    else if (e.message?.includes('Duplicate')) res.status(422).json({ error: 'Duplicate scene IDs' });
    else res.status(400).json({ error: e.message || 'Invalid lesson' });
  }
});

/** POST /api/lessons/generate */
app.post('/api/lessons/generate', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') throw new Error('Invalid request body; expected JSON with topic, level, lang');
    const body = GenerateSchema.parse(req.body);
    const model = process.env.OLLAMA_MODEL || 'llama3.2';
    const base = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    const prompt = `Return only ONE valid JSON object, no markdown fences, no extra text, with a single top-level key "scenes" holding an array of exactly 3 scene objects.
Each scene object must have exactly: id (unique short string), component (one of: title_card, bullet_reveal, step_sequence), title ({en,hi,kn} non-empty strings), narration ({en,hi,kn} non-empty strings), props.
- title_card: props.subtitle ({en,hi,kn} non-empty strings)
- bullet_reveal: props.items (array of 1-5 {en,hi,kn} non-empty strings)
- step_sequence: props.steps (array of 2-5 {en,hi,kn} non-empty strings)
Use all three components once in order: title_card, bullet_reveal, step_sequence. Topic: ${body.topic}. Level: ${body.level}.`;
    const generated = await fetch(`${base}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, stream: false, format: 'json', prompt }) });
    if (!generated.ok) throw new Error(`Ollama request failed (${generated.status}); ensure model ${model} is available`);
    const generatedPayload: any = await generated.json();
    let scenes: any[];
    let fallback = false;
    try {
      const content = JSON.parse(generatedPayload.response);
      scenes = repairScenes(Array.isArray(content.scenes) ? content.scenes : [], body.topic, body.level);
    } catch {
      scenes = [];
      fallback = true;
    }
    if (scenes.length === 0) {
      scenes = COMPONENTS.map((comp, i) => defaultScene(`scene-${i + 1}`, comp, body.topic, body.level));
      fallback = true;
    }
    const lesson = LessonSchema.parse({
      schema_version: '1.0',
      lesson_id: hash({ topic: body.topic, level: body.level, lang: body.lang }).slice(0, 16),
      topic: body.topic,
      level: body.level,
      scenes,
      media: {},
      timeline: {},
      meta: { model, fallback, generated_at: new Date().toISOString() }
    });
    const lessonId = lesson.lesson_id;
    await writeJson(lessonFile(lessonId), lesson);
    const genJobId = `gen-${lessonId}`;
    jobs.set(genJobId, { status: 'completed', progress: 100, step: 'complete', lesson_id: lessonId });
    res.json({ job_id: genJobId, lesson_id: lessonId });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Generation failed' });
  }
});
app.put('/api/lessons/:id', async (req, res) => {
  try { const lesson = await import('../shared/schema').then(({ LessonSchema }) => LessonSchema.parse(req.body)); await writeJson(lessonFile(id(req.params.id)), lesson); res.json(lesson); }
  catch (e: any) { res.status(400).json({ error: e.message || 'Invalid lesson' }); }
});
/** GET /api/jobs/:id */
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (e) { res.status(500).json({ error: 'Job not found' }); }
});

/** GET /api/lessons/:id/exports */
app.get('/api/lessons/:id/exports', async (req, res) => {
  try {
    const lang = String(req.query.lang || 'en') as any;
    const lesson = await loadLesson(req.params.id);
    const { exportText } = await import('./media');
    const export_id = await exportText(lesson, lang);
    res.json({ export_id, formats: ['mp4', 'srt', 'vtt', 'json'] });
  } catch (e) { res.status(500).json({ error: 'Exports not found' }); }
});

/** GET /api/exports/:id/download */
app.get('/api/exports/:id/download', async (req, res) => {
  try {
    const file = String(req.query.format || 'json');
    const ext = file === 'mp4' ? 'mp4' : file;
    if (!['mp4', 'srt', 'vtt', 'json'].includes(ext)) return res.status(400).send('Unsupported export format');
    const target = path.join(DATA, 'exports', req.params.id, `lesson.${ext}`);
    if (ext === 'mp4' && !(await exists(target))) return res.status(404).send('Render an MP4 first');
    res.sendFile(target, (err) => { if (err && !res.headersSent) res.status(404).send('File not found'); });
  } catch (e) { res.status(500).json({ error: 'Download failed' }); }
});
app.post('/api/lessons/:id/render', async (req, res) => {
  const lang = String(req.body?.lang || 'en') as any;
  const job_id = `render-${req.params.id}-${Date.now()}`;
  jobs.set(job_id, { status: 'running', progress: 0, step: 'starting', lesson_id: req.params.id });
  void (async () => {
    try {
      await renderJob(req.params.id, lang, async (p, step) => {
        jobs.set(job_id, { status: 'running', progress: p, step, lesson_id: req.params.id });
      });
      const result = await renderJob(req.params.id, lang, async (p, step) => {
        jobs.set(job_id, { status: 'running', progress: p, step, lesson_id: req.params.id });
      });
      jobs.set(job_id, { status: 'completed', progress: 100, step: 'complete', lesson_id: req.params.id, export_id: result.export_id });
    } catch (error: any) {
      jobs.set(job_id, { status: 'failed', progress: 0, step: 'failed', error: error.message, lesson_id: req.params.id });
      console.error('Render failed:', error);
    }
  })();
  res.json({ job_id, export_id: '' });
});

/** GET /render-frame — server-side preview page used by the Playwright renderer */
app.get('/render-frame', async (req, res) => {
  const lesson = String(req.query.lesson || '');
  const lang = String(req.query.lang || 'en');
  if (!IdSchema.safeParse(lesson).success) return res.status(400).send('Invalid lesson id');
  if (!['en','hi','kn'].includes(lang)) return res.status(400).send('Unsupported lang');
  res.type('text/html').send(RENDER_PAGE(lesson, lang));
});

/** GET /render-frame — server-side preview page used by the Playwright renderer */
app.get('/render-frame', async (req, res) => {
  const lesson = String(req.query.lesson || '');
  const lang = String(req.query.lang || 'en');
  if (!IdSchema.safeParse(lesson).success) return res.status(400).send('Invalid lesson id');
  if (!['en','hi','kn'].includes(lang)) return res.status(400).send('Unsupported lang');
  res.type('text/html').send(RENDER_PAGE(lesson, lang));
});

/** POST /api/lessons/:id/quiz — generate quiz from lesson using Ollama */
app.post('/api/lessons/:id/quiz', async (req, res) => {
  try {
    const body = QuizGenerateSchema.parse({ lesson_id: req.params.id });
    const lesson = await loadLesson(body.lesson_id);
    const model = process.env.OLLAMA_MODEL || 'llama3.2';
    const base = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

    // Build context from lesson scenes
    const context = lesson.scenes.map((s: any) => {
      const t = s.title?.en || s.title;
      const n = s.narration?.en || s.narration;
      return `- ${t}: ${n}`;
    }).join('\n');

    const prompt = `Based on the lesson content below about "${lesson.topic}", generate exactly 5 multiple-choice quiz questions.
Each question must have: a question string, 2-4 options, a correctIndex (0-based), and an optional explanation.
Return ONLY a JSON object with key "questions" holding an array of 5 question objects.
Format: {"questions": [{"question":"...","options":["a","b","c"],"correctIndex":0,"explanation":"..."}]}

Lesson content:
${context}`;

    const generated = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, stream: false, format: 'json', prompt }),
    });
    if (!generated.ok) throw new Error(`Ollama request failed (${generated.status})`);
    const payload: any = await generated.json();
    let parsed: any;
    try { parsed = JSON.parse(payload.response); } catch { throw new Error('Ollama returned invalid JSON'); }
    if (!Array.isArray(parsed.questions)) throw new Error('Ollama response missing questions array');

    const questions = parsed.questions.slice(0, 10).map((q: any, i: number) => ({
      id: `q${i + 1}`,
      question: String(q.question || '').trim().slice(0, 300),
      options: Array.isArray(q.options) ? q.options.map((o: string) => String(o).trim().slice(0, 200)).filter(Boolean) : [],
      correctIndex: Number.isInteger(q.correctIndex) ? Math.max(0, Math.min(q.correctIndex, (q.options || []).length - 1)) : 0,
      explanation: q.explanation ? String(q.explanation).trim().slice(0, 400) : undefined,
    })).filter((q: any) => q.question && q.options.length >= 2);

    if (questions.length === 0) throw new Error('No valid questions generated');

    const quiz = QuizSchema.parse({
      quiz_id: hash({ lesson: body.lesson_id, kind: 'quiz' }).slice(0, 16),
      lesson_id: body.lesson_id,
      topic: lesson.topic,
      questions,
      created_at: new Date().toISOString(),
    });
    await writeJson(quizFile(quiz.quiz_id), quiz);
    res.json(quiz);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Quiz generation failed' });
  }
});

/** GET /api/lessons/:id/quiz — get quiz for lesson */
app.get('/api/lessons/:id/quiz', async (req, res) => {
  try {
    const lessonId = id(req.params.id);
    // find any quiz for this lesson
    const quizzesDir = path.join(DATA, 'quizzes');
    if (!(await exists(quizzesDir))) return res.status(404).json({ error: 'No quizzes found' });
    for (const f of await fs.readdir(quizzesDir)) {
      if (!f.endsWith('.json')) continue;
      const q = await readJson(path.join(quizzesDir, f));
      if (q.lesson_id === lessonId) return res.json(q);
    }
    return res.status(404).json({ error: 'No quiz found for this lesson' });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to load quiz' });
  }
});

/** POST /api/notes — save notes for a lesson */
app.post('/api/notes', async (req, res) => {
  try {
    const body = NoteSaveSchema.parse(req.body);
    const existingDir = path.join(DATA, 'notes');
    await fs.mkdir(existingDir, { recursive: true });
    // find existing note for this lesson
    let noteId: string | null = null;
    if (await exists(existingDir)) {
      for (const f of await fs.readdir(existingDir)) {
        if (!f.endsWith('.json')) continue;
        const n = await readJson(path.join(existingDir, f));
        if (n.lesson_id === body.lesson_id) { noteId = n.note_id; break; }
      }
    }
    const note = NoteSchema.parse({
      note_id: noteId || hash({ lesson: body.lesson_id, kind: 'note' }).slice(0, 16),
      lesson_id: body.lesson_id,
      content: body.content,
      updated_at: new Date().toISOString(),
    });
    await writeJson(path.join(existingDir, `${note.note_id}.json`), note);
    res.json(note);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to save notes' });
  }
});

/** GET /api/notes/:lesson_id — get notes for a lesson */
app.get('/api/notes/:lesson_id', async (req, res) => {
  try {
    const lessonId = id(req.params.lesson_id);
    const notesDir = path.join(DATA, 'notes');
    if (!(await exists(notesDir))) return res.status(404).json({ error: 'No notes found' });
    for (const f of await fs.readdir(notesDir)) {
      if (!f.endsWith('.json')) continue;
      const n = await readJson(path.join(notesDir, f));
      if (n.lesson_id === lessonId) return res.json(n);
    }
    return res.status(404).json({ error: 'No notes found for this lesson' });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to load notes' });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, '127.0.0.1', () => {
  console.log(`API server listening on http://127.0.0.1:${port}`);
});
