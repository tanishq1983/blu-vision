import { useEffect, useState } from 'react';
import type { Lang } from '../../shared/schema';
import { downloadExport, getExports, putLesson } from '../lib/api';
import Quiz from './Quiz';
import Notes from './Notes';

interface Props { className?: string; lesson: any; lang: Lang; setLang: (l: Lang) => void; job: any; setJob: (j: any) => void; setLesson: (l: any) => void; onRender: () => void; onExport: () => void; setError: (e: string | null) => void; error: string | null; rendering: boolean; }

const exportFormats = [
  ['mp4', 'MP4 video', 'Render visual lesson'], ['srt', 'SRT captions', 'Subtitles'], ['vtt', 'WebVTT captions', 'Web player subtitles'], ['json', 'Lesson JSON', 'Portable lesson data'],
];

const tabs = [
  { key: 'export', label: 'Export', icon: '⬇' },
  { key: 'quiz', label: 'Quiz', icon: '❓' },
  { key: 'notes', label: 'Notes', icon: '📝' },
];

export default function RightPanel({ className, lesson, lang, job, setLesson, onRender, setError, error, rendering }: Props) {
  const [json, setJson] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('export');
  useEffect(() => { if (!editMode) setJson(lesson ? JSON.stringify(lesson, null, 2) : ''); }, [lesson, editMode]);

  const validate = async () => {
    try {
      const parsed = JSON.parse(json);
      await putLesson(parsed.lesson_id, parsed);
      setLesson(parsed); setError(null); setEditMode(false);
    } catch (e: any) { setError(`Could not save lesson: ${e.message}`); }
  };
  const handleDownload = async (format: string) => {
    if (!lesson) return;
    if (format === 'mp4') return onRender();
    try { const { export_id } = await getExports(lesson.lesson_id, lang); window.location.href = downloadExport(export_id, format); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <aside className={`panel-glass h-fit rounded-2xl p-4 sm:p-5 ${className ?? ''}`}>
      {lesson?.scenes?.length ? (
        <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-300">Lesson outline</p><h2 className="mt-1 text-lg font-semibold text-white">Scenes</h2></div><span className="rounded-lg bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-200">{lesson.scenes.length}</span></div>
      ) : (
        <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-300">Lesson outline</p><h2 className="mt-1 text-lg font-semibold text-white">Scenes</h2></div><span className="rounded-lg bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-200">0</span></div>
      )}
      {lesson?.scenes?.length ? <div className="muted-scrollbar max-h-[280px] space-y-2 overflow-y-auto pr-1">
        {lesson.scenes.map((scene: any, index: number) => <div key={`${scene.id}-${index}`} className="group flex gap-3 rounded-xl border border-white/[.07] bg-slate-950/25 p-3 transition hover:border-violet-400/30 hover:bg-violet-400/[.05]">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-400">{String(index + 1).padStart(2, '0')}</span>
          <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-200">{scene.title?.[lang] || scene.title?.en}</p><p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-slate-500">{String(scene.component).replace('_', ' ')}</p></div>
        </div>)}
      </div> : <div className="rounded-xl border border-dashed border-white/[.12] bg-slate-950/20 px-4 py-8 text-center"><p className="text-sm font-medium text-slate-400">No lesson in the studio</p><p className="mt-1 text-xs leading-5 text-slate-600">Generate a lesson or load the sample to see its scene outline.</p></div>}

      <div className="my-6 h-px bg-white/[.08]" />

      {/* Tab bar */}
      <div className="flex gap-1 mb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${activeTab === t.key
              ? 'bg-violet-500 text-white border-violet-400'
              : 'border-white/[.08] bg-white/[.02] text-slate-400 hover:border-white/[.2]'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-3">
        {activeTab === 'export' && (
          <>
            <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-slate-500">Lesson data</p><p className="mt-1 text-sm font-semibold text-white">Edit structure</p></div><button className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${editMode ? 'bg-violet-500 text-white' : 'border border-white/[.1] text-slate-300 hover:bg-white/[.06]'}`} onClick={() => setEditMode(value => !value)}>{editMode ? 'Close editor' : 'Edit JSON'}</button></div>
            {editMode && <><textarea className="muted-scrollbar h-52 w-full resize-y rounded-xl border border-white/[.1] bg-slate-950/50 p-3 font-mono text-[11px] leading-5 text-slate-300" value={json} onChange={e => setJson(e.target.value)} spellCheck={false} /><button className="mt-2 w-full rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-white" onClick={validate}>Validate & save changes</button></>}

            <div className="my-6 h-px bg-white/[.08]" />
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-300">Deliverables</p><h2 className="mt-1 text-lg font-semibold text-white">Export lesson</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {exportFormats.map(([format, title, description]) => <button key={format} className="rounded-xl border border-white/[.09] bg-white/[.025] p-3 text-left transition hover:border-violet-400/35 hover:bg-violet-400/[.07] disabled:cursor-not-allowed disabled:opacity-40" onClick={() => handleDownload(format)} disabled={!lesson || (format === 'mp4' && rendering)}>
                <span className="text-xs font-semibold text-slate-200">{format === 'mp4' && rendering ? 'Rendering…' : title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{description}</span>
              </button>)}
            </div>
          </>
        )}
        {activeTab === 'quiz' && <Quiz lessonId={lesson?.lesson_id || ''} lang={lang} />}
        {activeTab === 'notes' && <Notes lessonId={lesson?.lesson_id || ''} lang={lang} />}
      </div>

      {job && <p className="mt-3 rounded-lg bg-violet-400/[.06] px-3 py-2 text-xs text-violet-200">{job.step} · {job.progress ?? 0}%</p>}
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/[.08] px-3 py-2 text-xs text-rose-200">{error}</p>}
    </aside>
  );
}
