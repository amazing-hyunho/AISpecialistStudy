export function drawExamCells(records: { subject: string; sourceId: string }[], random: (max: number) => number = secureIndex) {
  const subjects = [...new Set(records.map(q => q.subject))];
  const all = [...new Set(records.map(q => q.sourceId))];
  if (all.length < 10 || subjects.length > 10) throw new Error('10셀 모의고사를 구성할 수 없습니다.');
  const selected = subjects.map(subject => {
    const pool = [...new Set(records.filter(q => q.subject === subject).map(q => q.sourceId))];
    return pool[random(pool.length)];
  });
  const rest = all.filter(id => !selected.includes(id));
  while (selected.length < 10) selected.push(rest.splice(random(rest.length), 1)[0]);
  for (let i = selected.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  return selected;
}

function secureIndex(max: number) {
  // Fresh browser randomness on every draw; rejection avoids modulo bias.
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
  return buffer[0] % max;
}
