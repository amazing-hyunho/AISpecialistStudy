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
const hooks = { ...React,
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
  useEffect() {},
};
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const ctx = { exports: {}, crypto: require('node:crypto').webcrypto, requestAnimationFrame: fn => fn(), require(name) {
    if (name === 'react') return hooks;
    if (name === 'next/link') return 'a';
    if (name.endsWith('.css')) return {};
    if (name === '../question-bank.json') return bank;
    if (name === './questions') return load('app/multiple-choice/questions.ts');
    if (name === './progress') return load('app/multiple-choice/progress.ts');
    return require(name);
  } };
  vm.runInNewContext(code, ctx); return ctx.exports;
}
const { questions, subjects, shuffle } = load('app/multiple-choice/questions.ts');
assert.equal(questions.length, 30);
assert.equal(new Set(questions.map(q => q.id)).size, 30);
for (const subject of subjects) assert.equal(questions.filter(q => q.subject === subject).length, 6);
for (const q of questions) {
  const original = bank.questions.find(source => `mc-${source.id}` === q.id);
  assert(original);
  assert.equal(q.choices.length, 4);
  assert.equal(new Set(q.choices.map(c => c.text.replace(/\s/g, ''))).size, 4);
  assert.equal(q.choices.filter(c => c.correct).length, 1);
  assert.equal(q.choices.find(c => c.correct).text, original.answer);
  assert(q.choices.every(c => c.reason.length > 15));
  assert(bank.cells[q.sourceId].source.includes(original.answer));
  const text = JSON.stringify(q.choices);
  assert.equal(new Set(shuffle(q.choices).map(c => c.id)).size, 4);
  assert.equal(JSON.stringify(q.choices), text);
}
const orders = new Set(Array.from({ length: 60 }, () => shuffle([0, 1, 2, 3]).join('')));
assert(orders.size > 10);
const { readProgress, recordAnswer, STORAGE_KEY } = load('app/multiple-choice/progress.ts');
assert(!STORAGE_KEY.includes('trainer-progress'));
const ids = questions.map(q => q.id);
assert.equal(JSON.stringify(readProgress('{invalid', ids)), '{"wrong":[],"solved":[]}');
assert.equal(JSON.stringify(readProgress('null', ids)), '{"wrong":[],"solved":[]}');
assert.equal(JSON.stringify(readProgress(JSON.stringify({ wrong: [ids[0], ids[0], 'bad', 12], solved: 'bad' }), ids)), JSON.stringify({ wrong: [ids[0]], solved: [] }));
let progress = recordAnswer({ wrong: [], solved: [] }, ids[0], false);
progress = recordAnswer(progress, ids[0], false);
progress = recordAnswer(progress, ids[0], true);
assert.equal(progress.wrong.length, 1); // Correct retries do not silently delete notes.
assert.equal(progress.solved.length, 1);
assert.equal(JSON.stringify(readProgress(JSON.stringify(progress), ids)), JSON.stringify(progress));

const Page = load('app/multiple-choice/page.tsx').default;
const render = () => { cursor = 0; return Page(); };
function all(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(n => all(n, predicate));
  return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)];
}
const cls = (tree, name) => all(tree, n => n.props?.className?.split(' ').includes(name));
const radios = tree => all(tree, n => n.type === 'input' && n.props.type === 'radio');
const buttons = tree => all(tree, n => n.type === 'button');
const key = tree => tree.props.onKeyDown({ nativeEvent: {}, ctrlKey: true, key: 'Enter', preventDefault() {} });
for (let subject = 0; subject < 5; subject++) {
  slots.length = 0;
  let tree = render();
  assert(cls(tree, 'mc-subject').every(n => n.props.disabled));
  slots[1] = true; // hydration complete; persistence parsing tested above
  tree = render();
  cls(tree, 'mc-subject')[subject].props.onClick();
  tree = render();
  key(tree); tree = render();
  assert.equal(cls(tree, 'mc-review').length, 0); // No blank submission.
  for (let i = 0; i < 6; i++) {
    assert.equal(radios(tree).length, 4);
    assert.equal(cls(tree, 'mc-review').length, 0);
    assert(radios(tree).every(n => !n.props.checked));
    // First question wrong, others correct. Correct ID is stable when positions shuffle.
    radios(tree).find(n => n.props.value === (i === 0 ? 1 : 0)).props.onChange();
    tree = render(); key(tree); tree = render();
    assert.equal(cls(tree, 'mc-review').length, 1);
    assert.equal(all(tree, n => n.type === 'h3').length, 4);
    assert.equal(all(tree, n => n.type === 'fieldset')[0].props.disabled, true);
    assert.equal(all(tree, n => n.type === 'details').length, 1);
    key(tree); tree = render();
  }
  assert.equal(slots[7], 5);
  assert.equal(slots[0].wrong.length, 1);
  assert.equal(slots[0].solved.length, 5);
  buttons(tree).find(n => n.props.children === '과목 선택').props.onClick();
  tree = render();
  buttons(tree).find(n => n.props.children === '오답 전체 복습').props.onClick();
  tree = render();
  assert.equal(slots[3].length, 1);
  radios(tree).find(n => n.props.value === 0).props.onChange();
  tree = render(); key(tree); tree = render();
  assert.equal(slots[0].wrong.length, 1);
  buttons(tree).find(n => n.props.children === '이 문항 오답 해결').props.onClick();
  tree = render();
  assert.equal(slots[0].wrong.length, 0);
}
console.log('PASS: 30 source-linked questions, 5 subjects, 4 unique options each, rationales, shuffled positions, storage validation, empty-submit guard, all rounds, keyboard grading, score and explicit wrong-note resolution');
