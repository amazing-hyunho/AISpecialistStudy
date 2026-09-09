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
  const context = { exports: {}, requestAnimationFrame: fn => fn(), require(name) {
    if (name === 'react') return hooks;
    if (name === 'next/link') return () => null;
    if (name === './question-bank.json') return bank;
    if (name === './explanations') return load('app/explanations.ts');
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
assert.equal(byClass(tree, 'result-card')[0].props.className, 'result-card correct');
tree.props.onKeyDown({ ctrlKey: true, key: 'Enter', preventDefault() {} });
tree = render();
assert.equal(inputs(tree)[1].props['aria-current'], 'step');
assert.equal(inputs(tree)[0].props.value, answer);
inputs(tree)[1].props.onChange({ target: { value: 'line1\nline2' } });
tree = render();
assert.equal(inputs(tree)[1].props.rows, 2);
inputs(tree)[0].props.onFocus();
tree = render();
assert.equal(inputs(tree)[0].props['aria-current'], 'step');
assert.equal(inputs(tree)[1].props.value, 'line1\nline2');
console.log('PASS: inline inputs, exam placeholders, full cells, whitespace grading, Ctrl+Enter, multiline and retained drafts');
