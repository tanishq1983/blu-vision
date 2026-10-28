import { useEffect, useState } from 'react';
import type { Lang } from '../../shared/schema';
import { generateLesson, getLesson } from '../lib/api';

interface Props {
  className?: string; lang: Lang; setLang: (l: Lang) => void; lesson: any; setLesson: (l: any) => void;
  onGenerate: () => void; onLoadDemo: () => void; job: any; status: any; setJob: (j: any) => void; setError: (e: string | null) => void;
}

const languageOptions: Array<{ value: Lang; label: string }> = [
  { value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }, { value: 'kn', label: 'ಕನ್ನಡ' },
];

export default function LeftPanel({ className, lang, setLang, lesson, setLesson, onLoadDemo, job, status, setJob, setError }: Props) {
  const [topic, setTopic] = useState('Python Loops');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [polling, setPolling] = useState(false);

  useEffect(() => () => undefined, []);

  const generate = async () => {
    if (!topic.trim()) return setError('Enter a topic to create a lesson.');
    setError(null); setJob(null); setPolling(true);
    try {
      const { job_id } = await generateLesson(topic.trim(), level, lang);
      setJob({ id: job_id, status: 'running', progress: 0, step: 'Creating your lesson' });
      const poll = window.setInterval(async () => {
        try {
          const j = await fetch(`http://127.0.0.1:3001/api/jobs/${job_id}`).then(r => r.json());
          setJob(j);
          if (j.status === 'completed' || j.status === 'failed') {
            window.clearInterval(poll); setPolling(false);
            if (j.lesson_id) setLesson(await getLesson(j.lesson_id));
            if (j.error) setError(j.error);
          }
        } catch (error: any) {
          window.clearInterval(poll); setPolling(false); setError(error.message);
        }
      }, 1000);
    } catch (error: any) { setPolling(false); setError(error.message); }
  };

  const ttsOk = status.tts?.[lang]?.ok ?? false;
  const services = [
    ['Local model', status.ollama?.ok, status.ollama?.message ?? 'Not connected'],
    [`Voice · ${lang.toUpperCase()}`, ttsOk, status.tts?.[lang]?.message ?? 'Ready when configured'],
    ['Translation', true, 'Demo translations'],
    ['Render engine', status.ffmpeg !== false, status.ffmpeg?.message ?? 'Available'],
  ];

  return (
    <aside className={`panel-glass h-fit rounded-2xl p-4 sm:p-5 ${className ?? ''}`}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-violet-300">New lesson</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-white">Create a visual story</h1>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-400/10 text-violet-300">✦</span>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Lesson topic</span>
          <input className="w-full rounded-xl border border-white/[.1] bg-slate-950/40 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 transition focus:border-violet-400/60" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Python loops" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Level</span>
            <select className="w-full rounded-xl border border-white/[.1] bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200" value={level} onChange={e => setLevel(e.target.value as typeof level)}>
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Language</span>
            <select className="w-full rounded-xl border border-white/[.1] bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200" value={lang} onChange={e => setLang(e.target.value as Lang)}>
              {languageOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60" onClick={generate} disabled={polling}>
          <span>{polling ? 'Generating lesson…' : 'Generate lesson'}</span><span aria-hidden>→</span>
        </button>
        <button className="w-full rounded-xl border border-white/[.1] bg-white/[.035] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-400/[.08]" onClick={onLoadDemo}>Load sample lesson</button>
      </div>

      {job && <div className="mt-5 rounded-xl border border-violet-400/15 bg-violet-400/[.06] p-3">
        <div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-violet-200">{job.step}</span><span className="text-slate-400">{job.progress ?? 0}%</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${job.progress ?? 0}%` }} /></div>
      </div>}

      <div className="my-6 h-px bg-white/[.08]" />
      <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-slate-500">Workspace status</p><span className="text-[10px] text-slate-500">Offline first</span></div>
      <div className="space-y-3">
        {services.map(([name, ok, description]) => <div key={name as string} className="flex items-center gap-2.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`} />
          <div className="min-w-0"><p className="text-xs font-medium text-slate-300">{name}</p><p className="truncate text-[11px] text-slate-500">{description as string}</p></div>
        </div>)}
      </div>

      {lesson && <div className="mt-5 rounded-xl border border-white/[.08] bg-slate-950/25 px-3 py-2.5"><p className="truncate text-xs font-medium text-slate-300">{lesson.topic}</p><p className="mt-0.5 text-[11px] text-slate-500">{lesson.scenes?.length ?? 0} scenes · {lesson.level}</p></div>}
    </aside>
  );
}
