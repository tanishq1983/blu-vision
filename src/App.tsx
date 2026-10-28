import { useState, useEffect, useCallback, useRef } from 'react';
import LeftPanel from './components/LeftPanel';
import Stage from './components/Stage';
import RightPanel from './components/RightPanel';
import { generateLesson, getDemos, getLesson, renderLesson, getExports, downloadExport, doctor, type Lesson } from './lib/api';
import type { Lang } from '../shared/schema';
export default function App() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [status, setStatus] = useState<any>({});
  const [job, setJob] = useState<{id:string;status:string;progress:number;step:string;error?:string;lesson_id?:string;export_id?:string} | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [captions, setCaptions] = useState(true);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  useEffect(() => { doctor().then(setStatus).catch(() => setStatus({})); }, []);
  const loadDemo = useCallback(async () => {
    try {
      const { demos } = await getDemos();
      const les = await getLesson(demos[0].id);
      setLesson(les); setLang('en'); setJob(null); setError(null);
    } catch (e: any) { setError(e.message); }
  }, []);
  const handleGenerate = async () => { /* wired from LeftPanel via lesson received */ };
  const handleRender = async () => {
    if (!lesson) return;
    setRendering(true);
    try {
      const { job_id } = await renderLesson(lesson.lesson_id, lang);
      setJob({ id: job_id, status: 'running', progress: 0, step: 'rendering' });
      // Poll for render completion, then download MP4
      const poll = window.setInterval(async () => {
        try {
          const j = await fetch(`http://127.0.0.1:3001/api/jobs/${job_id}`).then(r => r.json());
          setJob(j);
          if (j.status === 'completed' || j.status === 'failed') {
            window.clearInterval(poll);
            setRendering(false);
            if (j.status === 'completed') {
              try {
                const { export_id } = await getExports(lesson.lesson_id, lang);
                const url = downloadExport(export_id, 'mp4');
                setVideoUrl(url);
                window.location.href = url;
              } catch (e: any) { setError(`Export failed: ${e.message}`); }
            }
            if (j.error) setError(j.error);
          }
        } catch (e: any) {
          window.clearInterval(poll);
          setRendering(false);
          setError(e.message);
        }
      }, 1000);
    } catch (e: any) {
      setRendering(false);
      setError(e.message);
    }
  };
  return (
    <div className="app-surface min-h-screen text-slate-100 selection:bg-violet-500/40">
      <audio ref={audioRef} crossOrigin="anonymous" />
      {videoUrl && (
        <div className="relative w-full">
          <video
            ref={videoRef}
            className="w-full h-[420px] object-cover bg-black rounded-2xl border border-white/[.08]"
            controls
            autoPlay
          />
          <button
            onClick={() => {
              const v = videoRef.current;
              if (v) v.paused ? v.play() : v.pause();
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 grid h-9 w-9 place-items-center rounded-full bg-violet-500 text-white shadow-lg"
          >
            {videoRef.current?.paused ? '▶' : 'Ⅱ'}
          </button>
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-white/[.07] bg-[#080c17]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1720px] items-center gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-black text-slate-950 shadow-lg shadow-violet-950/50">B</div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white">Blu Visual Teacher</div>
              <div className="text-[10px] font-medium uppercase tracking-[.18em] text-slate-500">Lesson studio</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 border-l border-white/[.08] pl-5 md:flex">
            <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">Visual lessons</span>
            <span className="text-xs text-slate-500">Create · preview · export</span>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1.5 text-xs font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Local workspace
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-[1720px] grid-cols-1 gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <LeftPanel className="xl:col-span-1" lang={lang} setLang={setLang} lesson={lesson} setLesson={setLesson} onGenerate={handleGenerate} onLoadDemo={loadDemo} job={job} status={status} setJob={setJob} setError={setError} />
        <Stage className="xl:col-span-1" lesson={lesson} lang={lang} setLang={setLang} playing={playing} time={time} captions={captions} volume={volume} setPlaying={setPlaying} setTime={setTime} setCaptions={setCaptions} setVolume={setVolume} audioRef={audioRef} job={job} setError={setError} />
        <RightPanel className="xl:col-span-1" lesson={lesson} lang={lang} setLang={setLang} job={job} setJob={setJob} setLesson={setLesson} onRender={handleRender} onExport={() => {}} setError={setError} error={error} rendering={rendering} />
      </main>
    </div>
  );
}
