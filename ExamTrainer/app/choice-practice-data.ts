import bank from './question-bank.json';
import { normalized } from './grading';
import { questions as curated } from './multiple-choice/questions';

export type BankQuestion = typeof bank.questions[number];
export function practiceChoices(question: BankQuestion) {
  const prepared = curated.find(q => q.id === `mc-${question.id}`);
  if (prepared) return prepared.choices;
  // Retrieval distractors, not fabricated code: the task explicitly asks for the
  // original notebook answer, not every semantically equivalent Python expression.
  const seen = new Set([normalized(question.answer)]);
  const tokens = new Set(question.answer.match(/[A-Za-z_][A-Za-z_0-9]*/g) ?? []);
  const receiver = question.answer.trim().match(/^([A-Za-z_][A-Za-z_0-9]*)\./)?.[1];
  const candidates = bank.questions.filter(q => q.id !== question.id).sort((a, b) => {
    const score = (q: BankQuestion) => (q.chapterId === question.chapterId ? 100 : 0)
      + (q.subject === question.subject ? 20 : 0) + (q.topic === question.topic ? 10 : 0)
      + (receiver && q.answer.trim().startsWith(`${receiver}.`) ? 60 : 0)
      + [...new Set(q.answer.match(/[A-Za-z_][A-Za-z_0-9]*/g) ?? [])].filter(token => tokens.has(token)).length * 15
      - Math.abs(q.answer.length - question.answer.length) / 1000;
    return score(b) - score(a);
  });
  const wrong = [];
  for (const candidate of candidates) {
    const key = normalized(candidate.answer);
    if (seen.has(key)) continue;
    seen.add(key);
    wrong.push({ id: wrong.length + 1, text: candidate.answer, correct: false,
      reason: `이 코드는 문제은행의 ‘${candidate.topic}’ 작성 구간(${candidate.id})에서 가져온 비교 보기입니다. 현재 빈칸의 원문 답안과는 다릅니다. 앞뒤 변수와 ${question.topic}의 역할을 함께 확인하세요.` });
    if (wrong.length === 3) break;
  }
  if (wrong.length !== 3) throw new Error(`Not enough distinct options: ${question.id}`);
  return [{ id: 0, text: question.answer, correct: true, reason: '현재 빈칸에 대응하는 강의자료 원문 답안입니다. 코드의 역할을 이해한 뒤 아래에서 직접 입력해 보세요.' }, ...wrong];
}

export function maskedCell(question: BankQuestion, source: string) {
  let start = -1;
  let from = 0;
  for (let i = 0; i <= question.occurrence; i++) {
    start = source.indexOf(question.answer, from);
    if (start < 0) throw new Error(`Missing answer in cell: ${question.id}`);
    from = start + question.answer.length;
  }
  return { before: source.slice(0, start), after: source.slice(from) };
}
