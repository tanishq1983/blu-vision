import { useEffect, useMemo, useRef } from 'react';
import type { Lang } from '../../shared/schema';

interface Props { className?: string; lesson: any; lang: Lang; setLang: (lang: Lang) => void; playing: boolean; time: number; captions: boolean; volume: number; setPlaying: (p: boolean) => void; setTime: (t: number) => void; setCaptions: (c: boolean) => void; setVolume: (v: number) => void; audioRef: React.RefObject<HTMLAudioElement | null>; job: any; setError: (e: string | null) => void; }

function PreviewArt({ scene, lang, progress }: { scene: any; lang: Lang; progress: number }) {
  const title = scene.title?.[lang] || scene.title?.en || 'Untitled scene';
  const narration = scene.narration?.[lang] || scene.narration?.en;
  const items = scene.props?.items || scene.props?.steps || scene.props?.nodes || [];
  const subtitle = scene.props?.subtitle?.[lang] || scene.props?.subtitle?.en;
  return <div className="relative flex h-full min-h-[360px] w-full overflow-hidden rounded-2xl bg-[#0d1225] p-6 sm:p-10">
    <div className="absolute -left-12 -top-20 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" /><div className="absolute -bottom-24 -right-8 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
    <div className="absolute left-[9%] top-[13%] h-24 w-24 rounded-3xl border border-violet-300/20 bg-violet-400/[.07] rotate-12" /><div className="absolute right-[12%] top-[19%] h-16 w-16 rounded-2xl border border-cyan-300/20 bg-cyan-400/[.07] -rotate-12" />
    <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col justify-center">
      <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.18em] text-violet-200"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" />Scene preview</div>
      <p className="max-w-xl text-sm font-medium text-violet-200/80">{subtitle || scene.component?.replace('_', ' ')}</p>
      <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">{title}</h1>
      {items.length > 0 ? <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">{items.slice(0, 4).map((item: any, index: number) => <div key={index} className="flex items-center gap-3 rounded-xl border border-white/[.1] bg-slate-950/25 px-4 py-3" style={{ opacity: index <= Math.ceil(progress * items.length) ? 1 : .38 }}><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-violet-400/15 text-xs font-bold text-violet-200">{index + 1}</span><span className="text-sm text-slate-200">{item[lang] || item.en}</span></div>)}</div> : <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">{narration}</p>}
    </div>
    <div className="absolute bottom-5 right-6 font-mono text-[10px] tracking-[.18em] text-white/25">BLU · VISUAL LESSON</div>
  </div>;
}

export default function Stage({ className, lesson, lang, setLang, playing, time, captions, volume, setPlaying, setTime, setCaptions, setVolume, audioRef, job, setError }: Props) {
  const sceneRef = useRef<string | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    const timeline = lesson?.timeline?.[lang];
    if (!audio || !lesson || !timeline?.scenes?.length) return;
    audio.volume = volume;
    if (playing) audio.play().catch(() => setPlaying(false)); else audio.pause();
    const segment = timeline.scenes.find((item: any) => time >= item.start && time < item.end) || timeline.scenes[timeline.scenes.length - 1];
    if (segment.id !== sceneRef.current) { sceneRef.current = segment.id; audio.src = lesson.media?.[lang]?.[segment.id]?.audio_path; audio.currentTime = Math.max(0, time - segment.start); if (playing) audio.play().catch(() => undefined); }
    const frame = requestAnimationFrame(() => { if (!audio.paused) { const current = timeline.scenes.find((item: any) => item.id === sceneRef.current); setTime(current ? current.start + audio.currentTime : time); } });
    return () => cancelAnimationFrame(frame);
  }, [playing, time, lesson, lang, volume, setPlaying, setTime, audioRef]);

  const display = useMemo(() => {
    if (!lesson?.scenes?.length) return null;
    const timeline = lesson.timeline?.[lang];
    if (!timeline?.scenes?.length) return { scene: lesson.scenes[0], progress: 1 };
    const segment = timeline.scenes.find((item: any) => time >= item.start && time < item.end) || timeline.scenes[timeline.scenes.length - 1];
    const scene = lesson.scenes.find((item: any) => item.id === segment.id) || lesson.scenes[0];
    return { scene, progress: Math.min(1, Math.max(.08, (time - segment.start) / Math.max(.01, segment.end - segment.start))) };
  }, [lesson, lang, time]);
  const total = lesson?.timeline?.[lang]?.total ?? 0;
  const selectScene = (scene: any) => { const segment = lesson?.timeline?.[lang]?.scenes?.find((item: any) => item.id === scene.id); if (segment) setTime(segment.start); };

  return <section className={`panel-glass min-w-0 rounded-2xl p-3 sm:p-4 ${className ?? ''}`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-violet-300">Visual canvas</p><h2 className="mt-1 text-lg font-semibold text-white">{lesson?.topic || 'Lesson preview'}</h2></div>
      <div className="flex items-center gap-1 rounded-xl border border-white/[.08] bg-slate-950/30 p-1">{(['en', 'hi', 'kn'] as Lang[]).map(item => <button key={item} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${item === lang ? 'bg-violet-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setLang(item)} aria-current={item === lang}>{item.toUpperCase()}</button>)}</div>
    </div>
    <div className="relative overflow-hidden rounded-2xl border border-white/[.08] bg-[#0d1225]">
      {display ? <PreviewArt scene={display.scene} lang={lang} progress={display.progress} /> : <div className="relative grid min-h-[430px] place-items-center overflow-hidden bg-[#0d1225] p-8 text-center"><div className="absolute h-72 w-72 rounded-full border border-violet-400/10" /><div className="absolute h-48 w-48 rounded-full border border-cyan-400/10" /><div className="relative"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-400/10 text-2xl text-violet-200">✦</div><h3 className="mt-5 text-lg font-semibold text-white">Your lesson canvas is ready</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Generate a new lesson or load the Python Loops sample to preview each scene here.</p></div></div>}
      <span className="absolute right-4 top-4 rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-300">16 : 9</span>
    </div>
    {captions && display && <p className="px-3 py-3 text-center text-sm leading-6 text-slate-300">{display.scene.narration?.[lang] || display.scene.narration?.en}</p>}
    <div className="mt-1 flex flex-wrap items-center gap-3 rounded-xl border border-white/[.07] bg-slate-950/30 p-3">
      <button className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500 text-sm text-white transition hover:bg-violet-400 disabled:opacity-40" onClick={() => setPlaying(!playing)} disabled={!lesson?.timeline?.[lang]} aria-label={playing ? 'Pause lesson' : 'Play lesson'}>{playing ? 'Ⅱ' : '▶'}</button>
      <span className="font-mono text-xs text-slate-400">{String(Math.floor(time)).padStart(2, '0')}:{String(Math.floor(time % 60)).padStart(2, '0')}</span>
      <input aria-label="Lesson timeline" type="range" min="0" max={total || 1} step="1" value={time} onChange={e => setTime(Number(e.target.value))} className="h-1 min-w-[120px] flex-1 accent-violet-400" disabled={!total} />
      <span className="font-mono text-xs text-slate-600">{total ? `00:${String(Math.floor(total)).padStart(2, '0')}` : 'No audio'}</span>
      <button className={`rounded-lg px-2 py-1 text-xs ${captions ? 'bg-white/[.08] text-slate-200' : 'text-slate-500'}`} onClick={() => setCaptions(!captions)}>CC</button>
      <select aria-label="Volume" className="rounded-lg border border-white/[.08] bg-slate-900 px-2 py-1 text-xs text-slate-300" value={volume} onChange={e => setVolume(Number(e.target.value))}><option value="1">100%</option><option value="0.5">50%</option><option value="0">Mute</option></select>
    </div>
    {lesson?.scenes?.length ? <div className="muted-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">{lesson.scenes.map((scene: any, index: number) => <button key={`${scene.id}-${index}`} className={`min-w-max rounded-lg border px-3 py-2 text-left transition ${display?.scene?.id === scene.id ? 'border-violet-400/50 bg-violet-400/[.12] text-violet-100' : 'border-white/[.07] bg-white/[.02] text-slate-500 hover:text-slate-300'}`} onClick={() => selectScene(scene)}><span className="mr-2 text-[10px] text-slate-600">{String(index + 1).padStart(2, '0')}</span><span className="text-xs font-medium">{scene.title?.[lang] || scene.title?.en}</span></button>)}</div> : null}
    {job && <p className="mt-3 text-center text-xs text-slate-500">{job.step} · {job.progress ?? 0}%</p>}
  </section>;
}
