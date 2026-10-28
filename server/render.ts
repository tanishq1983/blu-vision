import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadLesson, lessonFile, writeJson, DATA, hash } from './storage';
import { ffmpegPath, assembleAudio, exportText, narrate } from './media';
import ffprobe from 'ffprobe-static';
import type { Lang } from '../shared/schema';
import { chromium } from 'playwright';
export async function renderJob(lessonId: string, lang: Lang, progress: (p: number, step: string) => Promise<void>) {
  const lesson = await loadLesson(lessonId);
  await progress(20, 'TTS narration');
  const narrated = await narrate(lesson, lang, progress);
  await writeJson(lessonFile(lesson.lesson_id), narrated);
  await progress(55, 'Measuring audio');
  const audioPath = await assembleAudio(narrated, lang);
  const exportId = await exportText(narrated, lang);
  const outDir = path.join(DATA, 'exports', exportId);
  await fs.mkdir(outDir, { recursive: true });
  const outMp4 = path.join(outDir, 'lesson.mp4');
  const frameDir = path.join(DATA, 'cache', 'render', exportId);
  await fs.mkdir(frameDir, { recursive: true });
  await progress(65, 'Rendering frames');
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:3001/render-frame?lesson=${encodeURIComponent(lessonId)}&lang=${encodeURIComponent(lang)}`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { while (!(window as any).renderReady) { await new Promise(res => setTimeout(res, 50)); } });
  const tl = narrated.timeline[lang];
  if (!tl) throw new Error('Timeline missing after narration');
  const total = Math.ceil(tl.total);
  const n = Math.max(1, Math.floor(total * 24));
  for (let i = 0; i < n; i++) {
    await page.evaluate((sec: number) => (window as any).setTime(sec), i / 24);
    await page.screenshot({ path: path.join(frameDir, `frame-${String(i).padStart(5, '0')}.png`) });
  }
  await browser.close();
  await progress(90, 'Encoding MP4');
  const list = path.join(frameDir, 'list.txt');
  const esc = (s: string) => s.replace(/'/g, "'\\''");
  const entries = [...Array(n).keys()].map(i => "file '" + esc(path.join(frameDir, 'frame-' + String(i).padStart(5, '0') + '.png')) + "'\n").join('') + "file '" + esc(path.join(frameDir, 'frame-' + String(n - 1).padStart(5, '0') + '.png')) + "'\n";
  await fs.writeFile(list, entries);
  await runCmd(ffmpegPath, ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-i', audioPath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-vf', 'setpts=N/(24*TB),fps=24', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', outMp4], 300000);
  const probe = JSON.parse(await runCmd(ffprobe.path, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', outMp4], 30000));
  const duration = Number(probe.format?.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('MP4 verification failed');
  await progress(100, 'Render complete');
  return { export_id: exportId, mp4: `/data/exports/${exportId}/lesson.mp4`, duration };
}
async function runCmd(executable: string, args: string[], timeout = 180000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { shell: false, windowsHide: true });
    let out = '', err = '';
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch { } reject(new Error('timed out')); }, timeout);
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', code => { clearTimeout(timer); if (code !== 0) reject(new Error(`exit ${code}: ${err.slice(-2000)}`)); else resolve(out); });
  });
}