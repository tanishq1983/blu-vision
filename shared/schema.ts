import { z } from 'zod';

export const LangSchema = z.enum(['en', 'hi', 'kn']);
export type Lang = z.infer<typeof LangSchema>;
export const IdSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
const plain = (max: number) => z.string().min(1).max(max).refine(s => !/[<>\u0000-\u0008]/.test(s), 'HTML, SVG and control characters are forbidden');
export const LocalizedSchema = z.object({ en: plain(180), hi: plain(260), kn: plain(260) }).strict();
export type Localized = z.infer<typeof LocalizedSchema>;
const base = { id: IdSchema, title: LocalizedSchema, narration: z.object({ en: plain(600), hi: plain(1000), kn: plain(1000) }).strict() };
export const SceneSchema = z.discriminatedUnion('component', [
  z.object({ ...base, component: z.literal('title_card'), props: z.object({ subtitle: LocalizedSchema }).strict() }).strict(),
  z.object({ ...base, component: z.literal('bullet_reveal'), props: z.object({ items: z.array(LocalizedSchema).min(1).max(5) }).strict() }).strict(),
  z.object({ ...base, component: z.literal('flowchart'), props: z.object({ nodes: z.array(LocalizedSchema).min(2).max(5) }).strict() }).strict(),
  z.object({ ...base, component: z.literal('step_sequence'), props: z.object({ steps: z.array(LocalizedSchema).min(2).max(5) }).strict() }).strict(),
  z.object({ ...base, component: z.literal('array_search'), props: z.object({ values: z.array(z.number().int().min(-999).max(999)).min(3).max(10), target: z.number().int().min(-999).max(999) }).strict() }).strict(),
  z.object({ ...base, component: z.literal('neural_network'), props: z.object({ layers: z.array(z.number().int().min(1).max(6)).min(2).max(4), labels: z.array(LocalizedSchema).min(2).max(4) }).strict() }).strict(),
]);
export type Scene = z.infer<typeof SceneSchema>;
const MediaSchema = z.record(IdSchema, z.object({ audio_path: z.string().regex(/^\/data\/[a-zA-Z0-9/_-]+\.wav$/), duration_sec: z.number().positive().max(300) }).strict());
export const TimelineSchema = z.object({ scenes: z.array(z.object({ id: IdSchema, start: z.number().nonnegative(), end: z.number().positive() }).strict()).min(3).max(6), total: z.number().positive().max(1803) }).strict();
export const LessonSchema = z.object({
  schema_version: z.literal('1.0'), lesson_id: IdSchema, topic: plain(120), level: z.enum(['beginner', 'intermediate', 'advanced']),
  scenes: z.array(SceneSchema).min(3).max(6),
  media: z.object({ en: MediaSchema.optional(), hi: MediaSchema.optional(), kn: MediaSchema.optional() }).strict(),
  timeline: z.object({ en: TimelineSchema.optional(), hi: TimelineSchema.optional(), kn: TimelineSchema.optional() }).strict(),
  meta: z.object({ model: plain(120), fallback: z.boolean(), generated_at: z.string().datetime() }).strict(),
}).strict().superRefine((lesson, ctx) => {
  const ids = lesson.scenes.map(s => s.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'Duplicate scene IDs' });
  for (const lang of ['en', 'hi', 'kn'] as const) {
    const tl = lesson.timeline[lang];
    if (!tl) continue;
    let previous = 0;
    if (tl.scenes.length !== ids.length) ctx.addIssue({ code: 'custom', message: 'Timeline scene count mismatch' });
    tl.scenes.forEach((s, i) => {
      const duration = lesson.media[lang]?.[s.id]?.duration_sec;
      if (s.id !== ids[i] || Math.abs(s.start - previous) > .001 || s.end <= s.start || !duration || Math.abs(s.end - s.start - duration - .5) > .01)
        ctx.addIssue({ code: 'custom', message: `Invalid ${lang} timeline at ${s.id}` });
      previous = s.end;
    });
    if (Math.abs(previous - tl.total) > .001) ctx.addIssue({ code: 'custom', message: 'Timeline total mismatch' });
  }
});
export type Lesson = z.infer<typeof LessonSchema>;
export const GenerateSchema = z.object({ topic: plain(120), level: z.enum(['beginner', 'intermediate', 'advanced']), lang: LangSchema }).strict();
export type GenerateInput = z.infer<typeof GenerateSchema>;
export function assertLanguage(lesson: Lesson, lang: Lang) {
  const script = lang === 'hi' ? /[\u0900-\u097f]/ : lang === 'kn' ? /[\u0c80-\u0cff]/ : /[a-zA-Z]/;
  for (const scene of lesson.scenes) {
    const entries: Localized[] = [scene.title, scene.narration];
    if ('subtitle' in scene.props) entries.push(scene.props.subtitle);
    if ('items' in scene.props) entries.push(...scene.props.items);
    if ('nodes' in scene.props) entries.push(...scene.props.nodes);
    if ('steps' in scene.props) entries.push(...scene.props.steps);
    if ('labels' in scene.props) entries.push(...scene.props.labels);
    if (entries.some(x => !script.test(x[lang]))) throw new Error(`Missing or wrong-language ${lang} text in ${scene.id}`);
  }
}

export const QuizQuestionSchema = z.object({
  question: plain(300),
  options: z.array(plain(200)).min(2).max(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: plain(400).optional(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizSchema = z.object({
  quiz_id: IdSchema,
  lesson_id: IdSchema,
  topic: plain(120),
  questions: z.array(QuizQuestionSchema).min(1).max(10),
  created_at: z.string().datetime(),
}).strict();
export type Quiz = z.infer<typeof QuizSchema>;

export const NoteSchema = z.object({
  note_id: IdSchema,
  lesson_id: IdSchema,
  content: plain(5000),
  updated_at: z.string().datetime(),
}).strict();
export type Note = z.infer<typeof NoteSchema>;

export const QuizGenerateSchema = z.object({
  lesson_id: IdSchema,
}).strict();
export type QuizGenerateInput = z.infer<typeof QuizGenerateSchema>;

export const NoteSaveSchema = z.object({
  lesson_id: IdSchema,
  content: plain(5000),
}).strict();
export type NoteSaveInput = z.infer<typeof NoteSaveSchema>;