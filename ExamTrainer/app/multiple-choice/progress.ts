export type Progress = { wrong: string[]; solved: string[] };
export const STORAGE_KEY = 'ai-exam-multiple-choice-v1';
export function readProgress(raw: string | null, ids: string[]): Progress {
  try {
    const value = JSON.parse(raw ?? '{}');
    const clean = (items: unknown): string[] => Array.isArray(items)
      ? [...new Set(items.filter((id): id is string => typeof id === 'string' && ids.includes(id)))] : [];
    return { wrong: clean(value?.wrong), solved: clean(value?.solved) };
  } catch { return { wrong: [], solved: [] }; }
}
export function recordAnswer(progress: Progress, id: string, correct: boolean): Progress {
  return correct
    ? { ...progress, solved: [...new Set([...progress.solved, id])] }
    : { ...progress, wrong: [...new Set([...progress.wrong, id])] };
}
