/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const bank = require('../app/question-bank.json');
const vision = bank.questions.filter(q => q.subject === 'Vision');
assert.equal(vision.length, 34);
assert.equal(new Set(bank.questions.map(q => q.id)).size, bank.questions.length);
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../app/explanations.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, context);
for (const chapter of bank.chapters.filter(c => c.subject === 'Vision')) {
  assert.equal(chapter.questionCount, vision.filter(q => q.chapterId === chapter.id).length);
}
for (const sourceId of new Set(vision.map(q => q.sourceId))) {
  const cell = bank.cells[sourceId];
  const notebook = JSON.parse(fs.readFileSync(path.join(__dirname, '../../Study/Vision', cell.answerSource), 'utf8'));
  assert.equal(notebook.cells[cell.cell].cell_type, 'code');
  const original = notebook.cells[cell.cell].source.join('');
  const cleaned = original.split(/\r?\n/).filter(line => !(line.includes('use_auth_token') && line.includes('access_token'))).map(line => line.trimEnd()).join('\n').trim();
  assert.equal(cell.source, cleaned, sourceId);
  const ranges = vision.filter(q => q.sourceId === sourceId).map(q => {
    assert.equal(q.isSourceBlank, false, q.id);
    assert(context.exports.questionExplanations[q.id]?.why.length > 30, q.id);
    assert(context.exports.questionExplanations[q.id]?.memory.length > 10, q.id);
    let offset = -1, from = 0;
    for (let i = 0; i <= q.occurrence; i++) {
      offset = cell.source.indexOf(q.answer, from);
      assert(offset >= 0, q.id);
      from = offset + q.answer.length;
    }
    return { start: offset, end: from, id: q.id };
  }).sort((a, b) => a.start - b.start);
  for (let i = 1; i < ranges.length; i++) assert(ranges[i].start >= ranges[i - 1].end, `Overlapping blank: ${ranges[i].id}`);
}
console.log('PASS: 34 Vision questions; notebook code provenance, non-overlapping blanks, explanations, counts and no source-blank stars');
