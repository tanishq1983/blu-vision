import { useState, useEffect } from 'react';
import type { Lang } from '../../shared/schema';

interface NotesProps {
  lessonId: string;
  lang: Lang;
}

export default function Notes({ lessonId, lang }: NotesProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`http://127.0.0.1:3001/api/notes/${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setContent(data.content || '');
        }
      } catch { /* ignore load errors */ }
      finally { if (!cancelled) setLoading(false); }
      return () => { cancelled = true; };
    })();
  }, [lessonId]);

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch('http://127.0.0.1:3001/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, content }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Notes</h3>
        <button
          onClick={save}
          disabled={saving || !content.trim()}
          className={`rounded-xl px-2 py-1 text-xs font-semibold transition ${saving || !content.trim()
            ? 'bg-white/[.03] text-slate-500 cursor-not-allowed'
            : 'bg-cyan-500 text-white hover:bg-cyan-400'}`}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Take notes about this lesson…"
        className="w-full min-h-[200px] rounded-xl border border-white/[.08] bg-white/[.02] px-3 py-2 text-xs text-slate-200 focus:border-violet-400/50 focus:outline-none transition"
        disabled={loading}
      />
      {error && <p className="text-[10px] text-rose-400">{error}</p>}
      {loading && <p className="text-[10px] text-slate-400">Loading notes…</p>}
      {!loading && !content.trim() && !error && (
        <p className="text-[10px] text-slate-500 italic">No notes yet. Write something and save.</p>
      )}
    </div>
  );
}
