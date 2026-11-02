/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS build utility. */
// Build downloadable study sheets from the same reviewed content as the web page.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'app/october-recall/content.json'), 'utf8'));
const intro = '# 10월 AI Specialist 시험 복기 정리\n\n사용자 제공 복기 및 로컬 강의 코드 대조 기준. 정리일: 2026-11-03. 공식 시험지나 다음 시험 출제 범위가 아닙니다.\n\n';
const summary = intro + data.topics.map(t => `## ${t.subject} — ${t.title}\n\n자료: ${t.source}\n\n${t.notes.map(n => `- ${n}`).join('\n')}\n\n\x60\x60\x60python\n${t.code}\n\x60\x60\x60\n`).join('\n');
const exam = '# 10월 복기 모의고사\n\n권장 60분 · 25문항 · 각 4점 · 총 100점. 권장 시간과 배점은 학습용 설계입니다. 【빈칸】에 들어갈 코드만 작성하세요. 복기 기반 재구성 문제이며 실제 시험 원문이 아닙니다.\n\n' + data.questions.map((q,i) => `## ${i+1}. ${q.subject} — ${q.title} (4점)\n\n${q.prompt}\n\n\x60\x60\x60python\n${q.code}\n\x60\x60\x60\n`).join('\n');
const answers = '# 10월 복기 모의고사 정답·해설\n\n코드의 의미가 같으면 수동으로 정답 인정할 수 있습니다. 웹 자동 채점은 제공 답안과 토큰을 비교하며 임의의 동치 코드를 실행하지 않습니다.\n\n' + data.questions.map((q,i) => `## ${i+1}. ${q.title}\n\n\x60\x60\x60python\n${q.answers[0]}\n\x60\x60\x60\n\n${q.explanation}\n\n자료: ${q.source}\n`).join('\n');
const out = path.join(root, 'public/october');
fs.mkdirSync(out, {recursive:true});
for (const [file, text] of Object.entries({'summary.md':summary,'mock-exam.md':exam,'answers.md':answers})) fs.writeFileSync(path.join(out,file),text);
console.log('Generated October summary, mock exam and answers.');
