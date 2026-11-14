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
const {examQuestions, cellParts, subjects} = load('app/exam-prep/data.ts');
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
    'rag-015','rag-026','rag-016','rag-017','rag-027',
    'data-011','data-012','data-014','data-017','data-018',
    'vision-001','vision-036','vision-002','vision-003','vision-032',
    'ondevice-029','ondevice-006','oct-21','oct-23','oct-25',
  ]},
];
const questions = {...examQuestions, ...extra};
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
  let paper = `# 11월 대비 모의고사 ${set.name}\n\n범위: ${set.focus}\n\n권장 60분 · 25빈칸 · 빈칸당 4점 · 총 100점. 시간과 배점은 연습용입니다.\n\n복기에서 고른 대비 후보이며 실제 11월 출제나 확률을 검증한 자료가 아닙니다. 2회는 보완 범위이며 난이도 순서가 아닙니다.\n\n## 응시 방법\n\n- 【빈칸 번호】에 들어갈 코드만 답안란에 작성하세요. 여러 줄이 필요한 빈칸도 있습니다.\n- 같은 셀의 출제 빈칸은 동시에 가렸으며, 나머지 코드는 제공합니다. 전체 셀을 읽고 답하세요.\n- 강의 셀의 import·데이터·앞선 셀의 정의는 준비됐다고 가정합니다. 셀을 독립 실행하는 시험은 아닙니다.\n- 수식과 고정 설정은 제공된 코드를 참고하세요. 강의 API 기준이며 서버 연결은 필요하지 않습니다.\n- 풀 때 정답 파일은 열지 마세요. 답안란은 문서 하단에 있습니다.\n`;
  let key = `# 11월 대비 ${set.name} — 정답·해설\n\n빈칸당 4점, 과목당 20점, 총 100점. 미작성은 0점. 아래는 예시 답안이며 같은 shape와 동작의 동등한 구현도 정답으로 인정합니다. API 이름만 묻는 빈칸은 해당 위치에 들어갈 부분만 작성합니다. 다중 줄은 필요한 동작을 모두 충족하면 4점으로 채점하세요.\n`;
  const masked = [];
  for (const qs of groups.values()) {
    const first = qs[0];
    let code;
    if (!extra[first.id]) {
      code = cellParts(set.ids.filter(id => !extra[id]), first.id, true)
        .map(p => p.question ? `【빈칸 ${index.get(p.question.id)}】` : p.text).join('');
    } else {
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
    for (const q of qs) paper += `- **${index.get(q.id)}번 · ${q.topic}**: ${q.hint}\n`;
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
fs.writeFileSync(path.join(out, 'README.md'), '# 11월 대비 모의고사\n\n1회는 먼저 준비할 후보, 2회는 다음 후보를 연습합니다. 각 60분·25빈칸·100점이며 회차별로 5과목에서 5빈칸씩 출제합니다. 실제 출제 확률을 수치화한 자료는 아닙니다.\n\n| 회차 | 문제 | 별도 정답 |\n| --- | --- | --- |\n| 1회 · 우선 후보 | [문제](mock-1.md) | [정답·해설](mock-1-answers.md) |\n| 2회 · 다음 후보 | [문제](mock-2.md) | [정답·해설](mock-2-answers.md) |\n\n기존 강의 기반 문제은행과 10월 복기 정리를 사용했습니다. 같은 셀의 선택된 빈칸을 함께 가리고 전체 셀을 보존합니다. 두 회차의 문항 ID는 중복되지 않으며, 기존 웹 모의고사와 겹치는 연습 문항은 있습니다.\n\n생성·검증: `node scripts/create-november-mocks.cjs`\n');
