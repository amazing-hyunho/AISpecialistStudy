import plan from './plan.json';

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function dayDate(start: string, offset: number) {
  const date = new Date(`${validDate(start) ? start : plan.defaultStart}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { month:'long', day:'numeric', weekday:'short', timeZone:'Asia/Seoul' }).format(new Date(`${value}T03:00:00Z`));
}

export type Progress = { start: string; checked: Record<string, boolean>; notes: Record<string, string> };
export function parseProgress(raw: string): Progress {
  const empty = {start:plan.defaultStart, checked:{}, notes:{}};
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return empty;
    const ids = plan.days.flatMap(d => d.checks.map((_, i) => `${d.day}-${i}`));
    return {
      start:typeof data.start === 'string' && validDate(data.start) ? data.start : plan.defaultStart,
      checked:Object.fromEntries(ids.map(id => [id, data.checked?.[id] === true])),
      notes:Object.fromEntries(plan.days.map(d => [String(d.day), typeof data.notes?.[d.day] === 'string' ? data.notes[d.day] : ''])),
    };
  } catch { return empty; }
}
