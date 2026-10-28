import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { IdSchema, LessonSchema } from '../shared/schema';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = path.join(ROOT, 'data');
export const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const id = (value: unknown) => IdSchema.parse(value);
export async function exists(file: string) { try { await fs.access(file); return true; } catch { return false; } }
export async function writeJson(file: string, value: unknown) { await fs.mkdir(path.dirname(file), {recursive:true}); const tmp = `${file}.${process.pid}.tmp`; await fs.writeFile(tmp, JSON.stringify(value,null,2), 'utf8'); await fs.rename(tmp,file); }
export async function readJson(file: string) {
  return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
}
export const lessonFile = (lessonId: string) => path.join(DATA, 'lessons', `${id(lessonId)}.json`);
export async function loadLesson(lessonId: string) { return LessonSchema.parse(await readJson(lessonFile(lessonId))); }
export function dataPath(url: string) { if (!/^\/data\/[\w/-]+\.(wav|mp4|json|srt|vtt)$/.test(url)) throw new Error('Unsafe data path'); return path.join(DATA, url.slice(6)); }
