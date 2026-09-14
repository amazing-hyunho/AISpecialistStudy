/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const bank = require('../app/question-bank.json');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../app/final-handbook/topics.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, context);
const cards = context.exports.finalTopics;
assert.equal(cards.length, 14);
const subjects = new Set();
let count = 0;
for (const card of cards) {
  assert(card.reason && card.flow && card.trap);
  assert.equal(new Set(card.ids).size, card.ids.length);
  for (const id of card.ids) {
    const q = bank.questions.find(q => q.id === id);
    assert(q, id);
    subjects.add(q.subject);
    assert.notEqual(bank.cells[q.sourceId].sourceKind, 'reconstructed');
    assert(bank.cells[q.sourceId].source.includes(q.answer), id);
    count++;
  }
}
assert.equal(subjects.size, 5);
console.log(`PASS: ${cards.length} final-review topics, ${count} source-backed answer excerpts, all 5 subjects, no reconstructed cells`);
