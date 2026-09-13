'use client';

import { useRef, useState } from 'react';
import bank from './question-bank.json';
import { questionExplanations } from './explanations';
import { normalized } from './grading';

type Props = { cellIds: string[]; onHome: () => void; onRetry: () => void; onComplete: (correct: string[], wrong: string[]) => void };
type Question = typeof bank.questions[number];
const cells = bank.cells as Record<string, { source: string; cell: number; answerSource: string }>;
function offset(q: Question) {
  let start = 0, found = -1;
  for (let i = 0; i <= q.occurrence; i++) {
    found = cells[q.sourceId].source.indexOf(q.answer, start);
    if (found < 0) throw new Error(`빈칸 위치 오류: ${q.id}`);
    start = found + q.answer.length;
  }
  return found;
}

export default function MockExam({ cellIds, onHome, onRetry, onComplete }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const inputs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const summary = useRef<HTMLElement | null>(null);
  const groups = cellIds.map(id => ({ id, ...cells[id], questions: bank.questions.filter(q => q.sourceId === id).sort((a, b) => offset(a) - offset(b)) }));
  const questions = groups.flatMap(g => g.questions);
  const correct = (q: Question) => Boolean(answers[q.id]?.trim()) && normalized(answers[q.id]) === normalized(q.answer);
  const filled = questions.filter(q => answers[q.id]?.trim()).length;
  const correctCount = questions.filter(correct).length;
  const correctCells = groups.filter(g => g.questions.every(correct)).length;

  function submit() {
    if (submitted) return;
    setSubmitted(true);
    onComplete(questions.filter(correct).map(q => q.id), questions.filter(q => !correct(q)).map(q => q.id));
    requestAnimationFrame(() => { summary.current?.focus(); summary.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }
  function leave(action: () => void) {
    if (submitted || filled === 0 || window.confirm('진행 중인 답안은 저장되지 않습니다. 나가시겠어요?')) action();
  }

  return <main className="app-shell mock-exam">
    <header className="topbar"><button className="text-button" onClick={() => leave(onHome)}>← 학습 홈</button><strong>10셀 랜덤 모의고사</strong></header>
    <section className="mock-summary" ref={summary} tabIndex={-1} aria-label="모의고사 현황">
      <h1>{submitted ? '모의고사 결과' : '코드 흐름을 떠올리며 빈칸을 채워보세요.'}</h1>
      <p>5과목 최소 1셀씩 · 중복 없는 10셀 · 총 {questions.length}개 빈칸 · 매회 새 난수 추첨</p>
      <p>셀 안의 검증된 빈칸을 모두 풉니다. 시간 제한은 없으며 제출 전에는 정답·해설을 표시하지 않습니다.</p>
      <p>Ctrl + Enter: 다음 빈칸 · Tab: 들여쓰기 · Shift + Tab: 입력칸 밖으로 이동. 새로고침하면 진행 중인 답안은 사라집니다.</p>
      <p>강의 답안 코드 기준 채점이며 공백·들여쓰기는 무시합니다. 같은 의미의 다른 구현까지 판별하지는 않습니다.</p>
      {submitted && <div role="status">
        <h2>셀 {correctCells}/10 · 빈칸 {correctCount}/{questions.length}</h2>
        <p>한 셀의 모든 빈칸이 맞아야 해당 셀 정답입니다. 오답·미입력 빈칸은 오답노트에 저장했습니다.</p>
        <button className="primary-button" onClick={onRetry}>새 랜덤 10셀 시작</button>
      </div>}
    </section>
    <nav className="blank-picker" aria-label="모의고사 셀 목차">{groups.map((g, i) => <a key={g.id} href={`#mock-${g.id}`}>{i + 1}. {g.questions[0].subject} · Cell {g.cell}</a>)}</nav>
    {groups.map((g, index) => {
      const pieces = [];
      let cursor = 0;
      for (const q of g.questions) {
        const start = offset(q);
        const value = answers[q.id] ?? '';
        pieces.push(<span key={`${q.id}-text`}>{g.source.slice(cursor, start)}</span>);
        pieces.push(<span className="inline-answer-group" key={q.id}>
          <textarea className="inline-code-input" aria-label={`${index + 1}번 셀 · ${q.topic}`} aria-describedby={submitted ? `mock-feedback-${q.id}` : undefined}
            ref={element => { inputs.current[q.id] = element; }} value={value} readOnly={submitted}
            placeholder="### 공개 제한 ###" rows={Math.max(1, value.split('\n').length)}
            style={{ width: `${Math.min(90, Math.max(23, ...value.split('\n').map(line => line.length + 2)))}ch` }}
            spellCheck={false} autoCapitalize="off" autoComplete="off"
            onChange={event => { if (!submitted) setAnswers(previous => ({ ...previous, [q.id]: event.target.value })); }}
            onKeyDown={event => {
              if (submitted) return;
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                const next = questions[(questions.findIndex(item => item.id === q.id) + 1) % questions.length];
                inputs.current[next.id]?.focus();
                inputs.current[next.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else if (event.key === 'Tab' && !event.shiftKey) {
                event.preventDefault();
                const input = event.currentTarget, start = input.selectionStart, end = input.selectionEnd;
                setAnswers(previous => ({ ...previous, [q.id]: value.slice(0, start) + '    ' + value.slice(end) }));
                requestAnimationFrame(() => input.setSelectionRange(start + 4, start + 4));
              }
            }} />
          {submitted && <span id={`mock-feedback-${q.id}`} className={`result-card inline-feedback ${correct(q) ? 'correct' : 'wrong'}`}>
            <strong>{correct(q) ? '✓ 정답' : value.trim() ? '오답' : '미입력'}</strong>
            <span className="feedback-label">{q.topic} · 정답 코드</span><span className="answer-code">{q.answer}</span>
            <span className="feedback-label">해설</span><span>{questionExplanations[q.id]?.why ?? q.prompt}</span>
            {questionExplanations[q.id] && <span>{questionExplanations[q.id].memory}</span>}
          </span>}
        </span>);
        cursor = start + q.answer.length;
      }
      pieces.push(<span key="tail">{g.source.slice(cursor)}</span>);
      return <section className="code-window chapter-code" id={`mock-${g.id}`} key={g.id}>
        <div className="code-cell-title">{index + 1}/10 · {g.questions[0].subject} · {g.questions[0].chapterTitle} · Cell {g.cell} · 빈칸 {g.questions.length}개<br />{g.answerSource}</div>
        <pre><code>{pieces}</code></pre>
      </section>;
    })}
    {!submitted && <div className="quiz-actions"><span>입력 {filled}/{questions.length} · 미입력 {questions.length - filled}개도 오답 처리됩니다.</span><button className="primary-button" onClick={submit}>10셀 제출하고 채점</button></div>}
  </main>;
}
