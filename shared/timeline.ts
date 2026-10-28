import type { Lesson, Lang } from './schema';
export function buildTimeline(scenes: { id: string }[], durations: Record<string, number>) {
  let cursor = 0;
  const result = scenes.map(({ id }) => {
    const duration = durations[id];
    if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Invalid audio duration: ${id}`);
    const start = cursor;
    cursor += duration + .5;
    return { id, start, end: cursor };
  });
  return { scenes: result, total: cursor };
}
export interface Caption { start: number; end: number; text: string }
export function makeCaptions(lesson: Lesson, lang: Lang): Caption[] {
  return (lesson.timeline[lang]?.scenes ?? []).flatMap(segment => {
    const scene = lesson.scenes.find(s => s.id === segment.id)!;
    const words = scene.narration[lang].trim().split(/\s+/);
    const phrases: string[] = [];
    for (let i = 0; i < words.length; i += 7) phrases.push(words.slice(i, i + 7).join(' '));
    const total = phrases.reduce((n, p) => n + p.length, 0);
    const duration = lesson.media[lang]?.[scene.id]?.duration_sec ?? segment.end - segment.start - .5;
    let cursor = segment.start;
    return phrases.map(text => { const start = cursor; cursor += duration * text.length / total; return { start, end: cursor, text }; });
  });
}
export function timestamp(seconds: number, separator = ',') {
  const ms = Math.round(seconds * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2,'0')}:${String(Math.floor(ms / 60000) % 60).padStart(2,'0')}:${String(Math.floor(ms / 1000) % 60).padStart(2,'0')}${separator}${String(ms % 1000).padStart(3,'0')}`;
}
export function captionsText(captions: Caption[], format: 'srt' | 'vtt') {
  return (format === 'vtt' ? 'WEBVTT\n\n' : '') + captions.map((c,i) => `${i+1}\n${timestamp(c.start, format === 'vtt' ? '.' : ',')} --> ${timestamp(c.end, format === 'vtt' ? '.' : ',')}\n${c.text}\n`).join('\n');
}