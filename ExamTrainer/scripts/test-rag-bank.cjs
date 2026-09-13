/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const bank = require('../app/question-bank.json');
const rag = bank.questions.filter(q => q.subject === 'RAG');
const folders = { d1_llama: '1일차', d2_task1: '2일차', d2_task2: '2일차', d2_mcp: '2일차' };
assert.equal(rag.length, 28);
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../app/explanations.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, context);
for (const chapter of bank.chapters.filter(c => c.subject === 'RAG')) {
  assert.equal(chapter.questionCount, rag.filter(q => q.chapterId === chapter.id).length);
}
for (const sourceId of new Set(rag.map(q => q.sourceId))) {
  const cell = bank.cells[sourceId];
  const notebook = JSON.parse(fs.readFileSync(path.join(__dirname, '../../Study/RAG', folders[sourceId.split('-cell-')[0]], '실습 자료/Code', cell.answerSource), 'utf8'));
  assert.equal(notebook.cells[cell.cell].cell_type, 'code');
  const clean = notebook.cells[cell.cell].source.join('').split(/\r?\n/)
    .filter(line => line.trim() !== '### YOUR CODE HERE ###' && !['OPENAI_API_KEY', 'external_kg_server =', 'external_mcp_server =', '10.2.0.165'].some(fragment => line.includes(fragment)))
    .map(line => line.trimEnd()).join('\n').trim();
  assert.equal(cell.source, clean, sourceId);
  const ranges = rag.filter(q => q.sourceId === sourceId).map(q => {
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
  for (let i = 1; i < ranges.length; i++) assert(ranges[i].start >= ranges[i - 1].end, ranges[i].id);
}
console.log('PASS: 28 RAG questions; notebook provenance, no overlapping blanks, explanations, counts, source-star flags and sanitized source');
