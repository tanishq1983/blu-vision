const API = 'http://127.0.0.1:3001';
export async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}
export async function getJob(id: string) { return api<{status:string;progress:number;step:string;error?:string;lesson_id?:string;export_id?:string}>(`/api/jobs/${id}`); }
export async function generateLesson(topic: string, level: string, lang: string) { return api<{job_id:string;lesson_id:string}>('/api/lessons/generate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,level,lang})}); }
export async function getLesson(id: string) { return api<Lesson>(`/api/lessons/${id}`); }
export async function putLesson(id: string, lesson: any) { return api(`/api/lessons/${id}`, {method:'PUT',body:JSON.stringify(lesson)}); }
export async function renderLesson(id: string, lang: string) { return api<{job_id:string;export_id:string}>(`/api/lessons/${id}/render`, {method:'POST',body:JSON.stringify({lang})}); }
export async function getExports(id: string, lang: string) { return api<{export_id:string;formats:string[]}>(`/api/lessons/${id}/exports?lang=${lang}`); }
export function downloadExport(id: string, format: string) { return `${API}/api/exports/${id}/download?format=${format}`; }
export async function getDemos() { return api<{demos:{id:string;topic:string;languages:string[]}[]}>('/api/demos'); }
export async function doctor() { return api('/api/doctor'); }
export interface Lesson { schema_version:string; lesson_id:string; topic:string; level:string; scenes:any[]; media:any; timeline:any; meta:any; }