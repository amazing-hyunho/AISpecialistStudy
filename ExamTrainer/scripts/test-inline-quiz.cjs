// Lightweight component interaction checks without a browser or external services.
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const root = path.resolve(__dirname, '..');
const bank = require('../app/question-bank.json');
const slots = [];
let cursor = 0;
const hooks = {
  ...React,
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
  },
  useRef(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  },
  useEffect() {},
  useMemo(fn) { return fn(); },
};
function load(relative) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = { exports: {}, crypto: require('node:crypto').webcrypto, requestAnimationFrame: fn => fn(), require(name) {
    if (name === 'react') return hooks;
    if (name === 'next/link') return () => null;
    if (name === './question-bank.json') return bank;
    if (name === './explanations') return load('app/explanations.ts');
    if (name === './grading') return load('app/grading.ts');
    if (name === './mock-selection') return load('app/mock-selection.ts');
    if (name === './mock-exam') return load('app/mock-exam.tsx');
    return require(name);
  } };
  vm.runInNewContext(code, context);
  return context.exports;
}
const Home = load('app/page.tsx').default;
function render() { cursor = 0; return Home(); }
function all(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(n => all(n, predicate));
  return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)];
}
const byClass = (tree, name) => all(tree, n => n.props?.className?.split(' ').includes(name));
const inputs = tree => all(tree, n => n.type === 'textarea');
let tree = render();
byClass(tree, 'subject-card')[0].props.onClick();
tree = render();
byClass(tree, 'chapter-card')[0].props.onClick();
tree = render();
const expected = bank.questions.filter(q => q.chapterId === bank.chapters[0].id);
assert.equal(inputs(tree).length, expected.length);
assert.equal(byClass(tree, 'chapter-code').length, new Set(expected.map(q => q.sourceId)).size);
assert(inputs(tree).every(n => n.props.placeholder === '### 공개 제한 ###'));
assert.equal(all(tree, n => n.props?.id === 'answer').length, 0);
const first = inputs(tree)[0];
const question = expected.find(q => q.id === first.key);
const answer = question.answer.replace(/ /g, '   ');
first.props.onChange({ target: { value: answer } });
tree = render();
tree.props.onKeyDown({ ctrlKey: true, key: 'Enter', preventDefault() {} });
tree = render();
assert(byClass(tree, 'result-card')[0].props.className.includes('correct'));
const group = byClass(tree, 'inline-answer-group').find(n => inputs(n)[0].key === question.id);
assert.equal(byClass(group, 'inline-feedback').length, 1);
assert.equal(byClass(group, 'answer-code')[0].props.children, question.answer);
assert.equal(inputs(group)[0].props['aria-describedby'], `feedback-${question.id}`);
assert.equal(byClass(tree, 'inline-feedback').length, 1);
tree.props.onKeyDown({ ctrlKey: true, key: 'Enter', preventDefault() {} });
tree = render();
assert.equal(inputs(tree)[1].props['aria-current'], 'step');
assert.equal(byClass(tree, 'inline-feedback').length, 0);
assert.equal(inputs(tree)[0].props.value, answer);
inputs(tree)[1].props.onChange({ target: { value: 'line1\nline2' } });
tree = render();
assert.equal(inputs(tree)[1].props.rows, 2);
tree.props.onKeyDown({ ctrlKey: true, key: 'Enter', preventDefault() {} });
tree = render();
assert(byClass(tree, 'inline-feedback')[0].props.className.includes('wrong'));
inputs(tree)[1].props.onChange({ target: { value: 'line1\nline2' } });
tree = render();
assert.equal(byClass(tree, 'inline-feedback').length, 0);
inputs(tree)[0].props.onFocus();
tree = render();
assert.equal(inputs(tree)[0].props['aria-current'], 'step');
assert.equal(inputs(tree)[1].props.value, 'line1\nline2');
console.log('PASS: inline inputs, exam placeholders, full cells, whitespace grading, Ctrl+Enter, multiline and retained drafts');

const { drawExamCells } = load('app/mock-selection.ts');
const eligible = bank.questions.filter(q => bank.cells[q.sourceId].sourceKind !== 'reconstructed');
const selections = new Set();
for (let i = 0; i < 500; i++) {
  const ids = drawExamCells(eligible);
  assert(!ids.includes('dpo-completions'));
  assert.equal(ids.length, 10);
  assert.equal(new Set(ids).size, 10);
  assert.equal(new Set(bank.questions.filter(q => ids.includes(q.sourceId)).map(q => q.subject)).size, 5);
  selections.add(ids.join('|'));
}
assert(selections.size > 1);
const { normalized } = load('app/grading.ts');
assert.equal(normalized(' a + b '), normalized('a+b'));
assert.notEqual(normalized('a b'), normalized('ab'));
assert.notEqual(normalized('a >= b'), normalized('a > b'));
assert.notEqual(normalized('"a b"'), normalized('"ab"'));
const Mock = load('app/mock-exam.tsx').default;
slots.length = 0;
let saved = null;
const ids = drawExamCells(eligible);
const props = { cellIds: ids, onHome() {}, onRetry() {}, onComplete(correct, wrong) { saved = { correct, wrong }; } };
function renderMock() { cursor = 0; return Mock(props); }
tree = renderMock();
const examQuestions = bank.questions.filter(q => ids.includes(q.sourceId));
assert.equal(byClass(tree, 'chapter-code').length, 10);
assert.equal(inputs(tree).length, examQuestions.length);
assert.equal(byClass(tree, 'inline-feedback').length, 0);
const firstGroup = byClass(tree, 'inline-answer-group')[0];
const firstQ = bank.questions.find(q => q.id === firstGroup.key);
inputs(firstGroup)[0].props.onChange({ target: { value: firstQ.answer } });
tree = renderMock();
byClass(tree, 'quiz-actions')[0].props.children[1].props.onClick();
tree = renderMock();
assert.equal(saved.correct.length, 1);
assert.equal(saved.wrong.length, examQuestions.length - 1);
assert.equal(byClass(tree, 'inline-feedback').length, examQuestions.length);
assert(inputs(tree).every(n => n.props.readOnly));
slots.length = 0;
tree = renderMock();
assert(inputs(tree).every(n => n.props.value === ''));
for (const group of byClass(tree, 'inline-answer-group')) {
  inputs(group)[0].props.onChange({ target: { value: bank.questions.find(q => q.id === group.key).answer } });
}
tree = renderMock();
byClass(tree, 'quiz-actions')[0].props.children[1].props.onClick();
tree = renderMock();
assert.equal(saved.correct.length, examQuestions.length);
assert.equal(saved.wrong.length, 0);
assert(byClass(tree, 'inline-feedback').every(n => n.props.className.includes('correct')));
console.log('PASS: 500 random exams cover all subjects with 10 unique cells; delayed grading, blank answers, score callback, read-only review and fresh drafts');
