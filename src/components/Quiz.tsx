import { useState, useEffect } from 'react';
import type { Lang } from '../../shared/schema';
import { getLesson } from '../lib/api';

interface QuizProps {
  lessonId: string;
  lang: Lang;
}

export default function Quiz({ lessonId, lang }: QuizProps) {
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`http://127.0.0.1:3001/api/lessons/${lessonId}/quiz`);
        if (!res.ok) {
          if (res.status === 404) { setLoading(false); return; }
          throw new Error(`Quiz load failed: ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setQuiz(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
      return () => { cancelled = true; };
    })();
  }, [lessonId]);

  const generateQuiz = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`http://127.0.0.1:3001/api/lessons/${lessonId}/quiz`, { method: 'POST' });
      if (!res.ok) throw new Error(`Quiz generation failed: ${res.status}`);
      const data = await res.json();
      setQuiz(data);
      setAnswers({});
      setSubmitted(false);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  if (loading) return <div className="p-4 text-center text-slate-400 text-xs">Loading quiz…</div>;
  if (error) return <div className="p-4 text-center text-rose-400 text-xs">{error}</div>;
  if (!quiz) {
    return (
      <div className="p-4 text-center">
        <button
          onClick={generateQuiz}
          className="rounded-xl border border-white/[.09] bg-white/[.025] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-violet-400/35 hover:bg-violet-400/[.07]"
        >
          Generate Quiz
        </button>
      </div>
    );
  }

  const score = quiz.questions.reduce((acc: number, q: any, i: number) => {
    return acc + (answers[i] === q.correctIndex ? 1 : 0);
  }, 0);
  const pct = Math.round((score / quiz.questions.length) * 100);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[.2em] text-violet-300">Quiz · {quiz.topic}</h3>
        <span className="text-xs font-mono text-slate-400">{score} / {quiz.questions.length}</span>
      </div>
      <div className="bg-white/[.03] rounded-xl p-3 border border-white/[.05]">
        {quiz.questions.map((q: any, i: number) => (
          <div key={i} className="mb-3 last:mb-0">
            <p className="text-xs font-medium text-slate-200 mb-2">{i + 1}. {q.question}</p>
            <div className="space-y-1">
              {q.options.map((opt: string, j: number) => (
                <button
                  key={j}
                  onClick={() => setAnswers({ ...answers, [i]: j })}
                  className={`w-full text-left rounded border px-2 py-1.5 text-xs transition ${submitted
                    ? j === q.correctIndex
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
                      : j === answers[i]
                      ? 'border-rose-400 bg-rose-400/10 text-rose-200'
                      : 'border-white/[.08] bg-white/[.03] text-slate-400 hover:border-white/[.2]'
                    : 'border-white/[.08] bg-white/[.03] text-slate-400 hover:border-white/[.2] hover:bg-white/[.08]'}`}
                >
                  {String.fromCharCode(65 + j)}. {opt}
                </button>
              ))}
              {submitted && q.explanation && (
                <p className="text-[10px] mt-1 text-slate-400">{q.explanation}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {!submitted && (
        <button
          onClick={() => setSubmitted(true)}
          className="w-full rounded-xl bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={Object.keys(answers).length < quiz.questions.length}
        >
          Submit Quiz
        </button>
      )}
      {submitted && (
        <div className="text-center">
          <div className="text-2xl font-bold text-violet-400">{pct}%</div>
          <p className="text-xs text-slate-400">{score} of {quiz.questions.length} correct</p>
        </div>
      )}
    </div>
  );
}
