/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const bank = require('../app/question-bank.json');
const study = path.join(__dirname, '../../Study');
function notebooks(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? notebooks(path.join(dir, entry.name)) : entry.name.endsWith('.ipynb') ? [path.join(dir, entry.name)] : []);
}
const paths = notebooks(study);
const cache = new Map();
const ids = new Set();
let matched = 0;
let reconstructed = 0;
for (const q of bank.questions) {
  assert(!ids.has(q.id), q.id); ids.add(q.id);
  assert(bank.chapters.some(c => c.id === q.chapterId && c.subject === q.subject), q.id);
  assert(!/TODO|\?\?\?|YOUR CODE|^\s*pass\s*$/.test(q.answer), q.id);
  const cell = bank.cells[q.sourceId];
  assert(cell, q.id);
  if (cell.sourceKind === 'reconstructed') { reconstructed++; continue; }
  const candidates = paths.filter(p => path.basename(p) === path.basename(cell.answerSource));
  const found = candidates.some(p => {
    if (!cache.has(p)) cache.set(p, JSON.parse(fs.readFileSync(p, 'utf8')));
    const sourceCell = cache.get(p).cells[cell.cell];
    return sourceCell?.cell_type === 'code' && sourceCell.source.join('').includes(q.answer);
  });
  if (found) matched++;
  else console.log('REVIEW SOURCE:', q.id, cell.answerSource, cell.cell);
}
for (const [id, cell] of Object.entries(bank.cells)) {
  const ranges = bank.questions.filter(q => q.sourceId === id).map(q => {
    let offset = -1, from = 0;
    for (let i = 0; i <= q.occurrence; i++) {
      offset = cell.source.indexOf(q.answer, from);
      assert(offset >= 0, q.id);
      from = offset + q.answer.length;
    }
    return { start: offset, end: from, id: q.id };
  }).sort((a, b) => a.start - b.start);
  assert(ranges.length > 0, id);
  for (let i = 1; i < ranges.length; i++) assert(ranges[i].start >= ranges[i - 1].end, ranges[i].id);
}
for (const c of bank.chapters) assert.equal(c.questionCount, bank.questions.filter(q => q.chapterId === c.id).length);
console.log(`PASS: ${ids.size} questions, ${Object.keys(bank.cells).length} groups; IDs, counts, answer locations, no overlapping blanks or TODO answers. Original-cell answer matches: ${matched}/${ids.size - reconstructed}; reconstructed questions: ${reconstructed} (excluded from mock exams)`);
assert.equal(matched + reconstructed, ids.size, 'Review source discrepancies before claiming complete provenance');
