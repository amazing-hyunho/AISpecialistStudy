/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test harness for TypeScript modules. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
const root = path.join(__dirname, '..');
function load(file) {
  const filename = path.join(root, file);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod = {exports:{}};
  new Function('require','module','exports',code)(id => load(path.posix.join(path.posix.dirname(file), id + '.ts')), mod, mod.exports);
  return mod.exports;
}
const {matches} = load('app/october-recall/grading.ts');
const data = JSON.parse(fs.readFileSync(path.join(root,'app/october-recall/content.json'),'utf8'));
assert.equal(data.questions.length,25);
assert.equal(new Set(data.questions.map(q=>q.id)).size,25);
assert.deepEqual(Object.fromEntries(['LLM','RAG','Vision','Data','On-device'].map(s=>[s,data.questions.filter(q=>q.subject===s).length])),{LLM:7,RAG:6,Vision:4,Data:3,'On-device':5});
for(const q of data.questions) {
  assert.equal(q.code.split('【빈칸】').length,2,q.id);
  assert(q.source && q.explanation && q.prompt,q.id);
  for(const answer of q.answers) assert(matches(answer,q.answers),q.id);
  assert(!matches('',q.answers),q.id);
  assert(!matches('None',q.answers),q.id);
  // Every exam answer must occur in the consolidated study code.
  const compact = s => s.replace(/\s+/g,'');
  assert(data.topics.some(t=>compact(t.code).includes(compact(q.answers[0]))),q.id);
}
assert(matches("self.pos_emb=nn.Embedding(cfg['context_length'],cfg['emb_dim'],)",data.questions[5].answers));
assert(!matches('input_embedding = torch.cat([user_embedding, movie_embedding], dim=0)',data.questions[19].answers));
assert(!matches('mask[:prompt.shape[0] + 2] = True',data.questions[1].answers));
assert(!matches('output = output + output_scale',data.questions[21].answers));
assert(!matches('x = "a b"',['x = "ab"']));
assert(!matches('x = a + +b',['x = a + b']));
for(const file of ['summary.md','mock-exam.md','answers.md']) assert(fs.statSync(path.join(root,'public/october',file)).size>1000);
console.log('October recall: 25 questions, coverage, answer alignment, grading and downloads passed.');
