import path from 'node:path';
import { promises as fs } from 'node:fs';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import { run } from './process';
import { DATA, ROOT, exists, hash, writeJson, dataPath } from './storage';
import { assertLanguage, type Lang, type Lesson } from '../shared/schema';
import { buildTimeline, makeCaptions, captionsText } from '../shared/timeline';
export const python = process.env.PYTHON_PATH || path.join(ROOT,'.venv',process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
export const voices = {en:'mms-tts-eng',hi:'mms-tts-hin',kn:'mms-tts-kan'};
export const ffmpegPath = ffmpeg!;
export async function probe(file:string) { return JSON.parse(await run(ffprobe.path,['-v','error','-show_format','-show_streams','-of','json',file],30000)); }
export async function duration(file:string) { const p = await probe(file); const n = Number(p.format.duration); if(!Number.isFinite(n)||n<=0) throw new Error('Invalid measured audio duration'); return n; }
export function artifactKey(lesson:Lesson,lang:Lang) { return hash({scenes:lesson.scenes,lang,media:lesson.media[lang],timeline:lesson.timeline[lang],renderer:1}); }
export async function narrate(lesson:Lesson,lang:Lang,progress:(p:number,s:string)=>Promise<void>) {
  assertLanguage(lesson,lang);
  const media: NonNullable<Lesson['media']['en']> = {};
  for(let i=0;i<lesson.scenes.length;i++) {
    const scene=lesson.scenes[i];
    const key=hash({text:scene.narration[lang],lang,model:voices[lang],version:1,rate:.90});
    const folder=path.join(DATA,'cache','tts',key); const wav=path.join(folder,'audio.wav');
    let ok=false;
    if(!await exists(wav)) {
      try {
        await writeJson(path.join(folder,'input.json'),{text:scene.narration[lang],lang,model_dir:path.join(DATA,'models',voices[lang])});
        await run(python,[path.join(ROOT,'python','tts.py'),'--input',path.join(folder,'input.json'),'--output',wav],180000);
        ok=await exists(wav);
      } catch { ok=false; }
    } else ok=true;
    if(!ok) {
      const silent=path.join(folder,'silent.wav');
      await run(ffmpegPath,['-y','-f','lavfi','-i','anullsrc=channel_layout=mono:sample_rate=16000','-t','1','-c:a','pcm_s16le',silent],30000);
      media[scene.id]={audio_path:`/data/cache/tts/${key}/silent.wav`,duration_sec:await duration(silent)};
    } else {
      media[scene.id]={audio_path:`/data/cache/tts/${key}/audio.wav`,duration_sec:await duration(wav)};
    }
    await progress(35+Math.round((i+1)/lesson.scenes.length*35),`Narration ${i+1}/${lesson.scenes.length}`);
  }
  lesson.media[lang]=media;
  lesson.timeline[lang]=buildTimeline(lesson.scenes,Object.fromEntries(Object.entries(media).map(([k,v])=>[k,v.duration_sec])));
  return lesson;
}
export async function assembleAudio(lesson:Lesson,lang:Lang) {
  const key=artifactKey(lesson,lang); const folder=path.join(DATA,'cache','audio',key); const file=path.join(folder,'combined.wav');
  if(await exists(file)) return file;
  await fs.mkdir(folder,{recursive:true});
  const args:string[]=['-y']; const filters:string[]=[];
  lesson.scenes.forEach((s,i)=> { args.push('-i',dataPath(lesson.media[lang]![s.id].audio_path)); filters.push(`[${i}:a]aresample=16000,aformat=sample_fmts=s16:channel_layouts=mono,apad=pad_dur=0.5[a${i}]`); });
  filters.push(`${lesson.scenes.map((_,i)=>`[a${i}]`).join('')}concat=n=${lesson.scenes.length}:v=0:a=1[out]`);
  const tmp=path.join(folder,'combined.tmp.wav');
  args.push('-filter_complex',filters.join(';'),'-map','[out]','-c:a','pcm_s16le',tmp);
  await run(ffmpegPath,args); await duration(tmp); await fs.rename(tmp,file); return file;
}
export async function exportText(lesson:Lesson,lang:Lang) {
  const key=artifactKey(lesson,lang); const folder=path.join(DATA,'exports',key); await fs.mkdir(folder,{recursive:true});
  const captions=makeCaptions(lesson,lang);
  await fs.writeFile(path.join(folder,'lesson.srt'),captionsText(captions,'srt'),'utf8');
  await fs.writeFile(path.join(folder,'lesson.vtt'),captionsText(captions,'vtt'),'utf8');
  await writeJson(path.join(folder,'lesson.json'),lesson);
  return key;
}