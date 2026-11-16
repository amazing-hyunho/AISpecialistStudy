/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  const filename = path.resolve(root, file);
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename, reportDiagnostics: true,
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true},
  });
  assert.equal(compiled.diagnostics.length, 0);
  const exports = {};
  cache.set(filename, exports);
  vm.runInNewContext(compiled.outputText, {exports, require(name) {
    if (!name.startsWith('.')) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([base, base + '.ts', base + '.json'].find(p => fs.existsSync(p) && fs.statSync(p).isFile()));
  }}, {filename});
  return exports;
}
const {examQuestions, subjects} = load('app/exam-prep/data.ts');
const october = load('app/october-recall/content.json');
const extra = {};
// Keep October's complete topic excerpt, masking only the requested implementation.
for (const id of ['oct-21', 'oct-23', 'oct-25']) {
  const q = october.questions.find(q => q.id === id);
  const topic = october.topics.find(t => t.subject === q.subject && t.code.includes(q.answers[0]));
  assert(topic, id);
  const answer = q.answers[0], start = topic.code.indexOf(answer);
  extra[id] = {...q, topic: q.title, hint: q.prompt, answer, fullCode: topic.code,
    start, end: start + answer.length, cellKey: topic.source, explanation: q.explanation};
}
extra['oct-23'].hint += ' feature_bitwidth=8이며 get_quantized_range는 signed 정수 범위를 반환합니다.';
extra['oct-25'].hint += ' 제공식: q=clamp(round(w/scales)+zeros, 0, max_int), 복원값=(q-zeros)*scales.';
const sets = [
  {name: '1회 — 먼저 준비할 후보', slug: 'mock-1', focus: 'MHA·GPT / 기본 RAG / Sliding window·Encoder–Decoder / Attention·Residual / Kernel·Channel pruning', ids: [
    'llm-089','llm-092','llm-051','llm-055','llm-006',
    'rag-001','rag-029','rag-005','rag-024','rag-025',
    'data-034','data-035','data-037','data-040','data-041',
    'vision-004','vision-005','material-vit-value','vision-024','vision-035',
    'ondevice-067','ondevice-068','ondevice-061','ondevice-063','ondevice-064',
  ]},
  {name: '2회 — 다음 후보', slug: 'mock-2', focus: 'DPO·LoRA / MCP Client·Tool·Agent / NGCF·NCF / CIFAR 전처리·ResNet / CNN·LLM 양자화', ids: [
    'llm-083','llm-085','llm-016','llm-009','llm-010',
    'rag-015','rag-026','rag-016','rag-028','rag-027',
    'data-011','data-012','data-014','data-017','data-018',
    'vision-001','vision-036','vision-002','vision-016','vision-032',
    'ondevice-029','ondevice-006','oct-21','oct-23','oct-25',
  ]},
];
const originals = {...examQuestions, ...extra};
// Expand the blank in the same source cell; never alter the other collections.
function withRange(q, start, end) {
  assert(start >= 0 && start <= q.start && end >= q.end, q.id);
  return {...q, start, end, answer:q.fullCode.slice(start,end)};
}
function withText(q, text) {
  const start=q.fullCode.indexOf(text);
  return withRange(q,start,start+text.length);
}
function completeCall(q) {
  const code=q.fullCode;
  let end=q.end, depth=0, quote=null;
  assert.equal(code[end],'(',q.id);
  for (;end<code.length;end++) {
    const ch=code[end];
    if (quote) {if(ch==='\\')end++;else if(ch===quote)quote=null;continue;}
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='(')depth++;
    if(ch===')' && --depth===0) return withRange(q,q.start,end+1);
  }
  throw new Error(`Unclosed call: ${q.id}`);
}
const expanded = {};
for (const set of sets) for (const id of set.ids) {
  let q={...originals[id]};
  if (/^[\w.]+$/.test(q.answer)) q=completeCall(q);
  if (id==='data-011') q=withText(q,'self.W1(src_feat) + self.W2(src_feat*dst_feat)');
  if (id==='llm-016') q=withRange(q,q.start-1,q.end);
  if (id==='llm-085') q=withRange(q,q.start,q.end+'.squeeze(-1)'.length);
  if (id==='vision-005') q=withRange(q,q.start,q.end+' * self.scale'.length);
  if (id==='llm-089') {
    const start=q.fullCode.lastIndexOf('keys = ',q.start);
    const last=q.fullCode.indexOf('queries = queries.view',q.end);
    q=withRange(q,start,q.fullCode.indexOf('\n',last));
  }
  if (id==='llm-092') {
    const start=q.fullCode.lastIndexOf('keys = ',q.start);
    const last=q.fullCode.indexOf('values = values.transpose',q.end);
    q=withRange(q,start,q.fullCode.indexOf('\n',last));
  }
  if (id==='data-040') {
    const start=q.fullCode.lastIndexOf('out, h = self.decoder',q.start);
    q=withRange(q,start,q.end);
  }
  if (id==='ondevice-061') {
    const start=q.fullCode.lastIndexOf('num_channels = ',q.start);
    const last=q.fullCode.indexOf('num_pruned_channels = ',q.end);
    q=withRange(q,start,q.fullCode.indexOf('\n',last));
  }
  assert(!/^[\w.]+$/.test(q.answer),`Name-only blank: ${id}`);
  // Remove explicit answer hints/TODOs from the November display copy only.
  const comments=/^[ \t]*#[^\n]*(?:힌트|TODO|gather|logsigmoid|einsum)[^\n]*\n/gmi;
  const before=q.fullCode.slice(0,q.start).replace(comments,'');
  const answer=q.answer.replace(comments,'');
  const after=q.fullCode.slice(q.end).replace(comments,'');
  expanded[id]={...q,id:`nov2-${id}`,sourceQuestionId:id,fullCode:before+answer+after,
    start:before.length,end:before.length+answer.length,answer,hint:'',choices:[],
    context:before+'【빈칸】'+after,kind:'11월 구현형 · 확장 빈칸',
    prompt:'전체 코드의 흐름에 맞게 빈칸을 완성하세요.'};
}
const questions=Object.fromEntries(Object.values(expanded).map(q=>[q.id,q]));
for(const set of sets)set.ids=set.ids.map(id=>expanded[id].id);
const out = path.join(root, 'public', 'november');
fs.mkdirSync(out, {recursive: true});
const fence = code => '```python\n' + code.trimEnd() + '\n```';
const manifest = [];
for (const set of sets) {
  assert.equal(set.ids.length, 25);
  for (const subject of subjects) assert.equal(set.ids.filter(id => questions[id].subject === subject).length, 5);
  const index = new Map(set.ids.map((id, i) => [id, i + 1]));
  const groups = new Map();
  for (const id of set.ids) {
    const q = questions[id]; assert(q, id);
    assert.equal(q.fullCode.slice(q.start, q.end), q.answer, id);
    if (!groups.has(q.cellKey)) groups.set(q.cellKey, []);
    groups.get(q.cellKey).push(q);
  }
  let paper = `# 11월 대비 모의고사 ${set.name}\n\n범위: ${set.focus}\n\n권장 60분 · 25빈칸 · 빈칸당 4점 · 총 100점. 시간과 배점은 연습용입니다.\n\n복기에서 고른 대비 후보이며 실제 11월 출제나 확률을 검증한 자료가 아닙니다. 2회는 보완 범위이며 난이도 순서가 아닙니다.\n\n## 응시 방법\n\n- 【빈칸 번호】에 들어갈 코드만 답안란에 작성하세요. 여러 줄이 필요한 빈칸도 있습니다.\n- 같은 셀의 출제 빈칸은 동시에 가렸으며, 나머지 코드는 제공합니다. 전체 셀을 읽고 답하세요.\n- 강의 셀의 import·데이터·앞선 셀의 정의는 준비됐다고 가정합니다. 셀을 독립 실행하는 시험은 아닙니다.\n- 학습용 힌트 없이 제공된 코드의 흐름에 맞게 작성하세요. 강의 API 기준이며 서버 연결은 필요하지 않습니다.\n- 풀 때 정답 파일은 열지 마세요. 답안란은 문서 하단에 있습니다.\n`;
  let key = `# 11월 대비 ${set.name} — 정답·해설\n\n빈칸당 4점, 과목당 20점, 총 100점. 미작성은 0점. 아래는 예시 답안이며 같은 shape와 동작의 동등한 구현도 정답으로 인정합니다. 호출식은 인수까지, 여러 줄 빈칸은 필요한 동작을 모두 작성하세요.\n`;
  const masked = [];
  for (const qs of groups.values()) {
    const first = qs[0];
    let code;
    {
      code = first.fullCode;
      let cursor = code.length;
      for (const q of [...qs].sort((a,b) => b.start-a.start)) {
        assert(q.end <= cursor); assert.equal(q.fullCode, first.fullCode);
        code = code.slice(0,q.start) + `【빈칸 ${index.get(q.id)}】` + code.slice(q.end);
        cursor = q.start;
      }
    }
    masked.push(code);
    paper += `\n## ${first.subject} — 빈칸 ${qs.map(q => index.get(q.id)).join(', ')}\n\n출처: ${first.source}\n\n`;
    for (const q of qs) paper += `- **${index.get(q.id)}번 · ${q.topic}**\n`;
    paper += '\n' + fence(code) + '\n';
  }
  for (const [i, id] of set.ids.entries()) {
    const q = questions[id];
    key += `\n## ${i+1}번 · ${q.subject} — ${q.topic}\n\n${fence(q.answer)}\n\n${q.explanation}\n\n출처: ${q.source}\n`;
  }
  paper += '\n## 답안란\n\n' + set.ids.map((id,i) => `${i+1}. ____________________\n`).join('\n');
  const labels = masked.join('\n').match(/【빈칸 \d+】/g);
  assert.equal(labels.length, 25); assert.equal(new Set(labels).size, 25);
  // Restore every blank and compare with the exact source cell, including whitespace.
  [...groups.values()].forEach((qs,i) => {
    const restored = masked[i].replace(/【빈칸 (\d+)】/g, (_, n) => questions[set.ids[Number(n)-1]].answer);
    assert.equal(restored, qs[0].fullCode);
  });
  fs.writeFileSync(path.join(out, set.slug + '.md'), paper.replace(/[ \t]+$/gm, ''));
  fs.writeFileSync(path.join(out, set.slug + '-answers.md'), key);
  manifest.push({...set, questions: set.ids.map((id,i) => ({number:i+1, id, subject:questions[id].subject, source:questions[id].source}))});
  console.log(`${set.slug}: 25 blanks, 5 per subject; ${groups.size} complete source cells; exact restoration passed`);
}
assert.equal(new Set(sets.flatMap(s => s.ids)).size, 50);
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'app/exam-prep/november.json'), JSON.stringify({
  exams: sets.map(set => ({id: `november-${set.slug}-v2`, title: `11월 대비 ${set.name}`,
    description: `${set.focus}. 구현형 개편 · 이름 대신 인수·축·연산 흐름을 직접 작성합니다. 권장 60분 · 25빈칸 · 각 4점. 이전 버전 기록은 보존되며 새 회차로 시작합니다.`,
    questionIds: set.ids, implementation: true})),
  questions: Object.values(questions),
}, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'README.md'), '# 11월 대비 모의고사\n\n1회는 먼저 준비할 후보, 2회는 다음 후보를 연습합니다. 각 60분·25빈칸·100점이며 회차별로 5과목에서 5빈칸씩 출제합니다. 실제 출제 확률을 수치화한 자료는 아닙니다.\n\n| 회차 | 문제 | 별도 정답 |\n| --- | --- | --- |\n| 1회 · 우선 후보 | [문제](mock-1.md) | [정답·해설](mock-1-answers.md) |\n| 2회 · 다음 후보 | [문제](mock-2.md) | [정답·해설](mock-2-answers.md) |\n\n구현형 개편: 함수·멤버 이름만 채우는 빈칸을 호출식·연산식·여러 줄 구현으로 확장했습니다. 이전 버전 기록은 보존되며 새 회차로 시작합니다.\n\n기존 강의 기반 문제은행과 10월 복기 정리를 사용했습니다. 같은 셀의 선택된 빈칸을 함께 가리고 전체 셀을 보존합니다. 두 회차의 문항 ID는 중복되지 않으며, 기존 웹 모의고사와 겹치는 연습 문항은 있습니다.\n\n생성·검증: `node scripts/create-november-mocks.cjs`\n');
