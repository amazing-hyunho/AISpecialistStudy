'use client';

import Link from 'next/link';
import { useState } from 'react';
import content from './content.json';
import { matches } from './grading';
import './recall.css';

const key = 'ai-october-recall-v1';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const subjects = ['LLM', 'RAG', 'Vision', 'Data', 'On-device'];

export default function OctoberRecall() {
  const [tab, setTab] = useState<'summary' | 'exam'>('summary');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [onlyWrong, setOnlyWrong] = useState(false);
  const [message, setMessage] = useState('답안을 입력하면 이 브라우저에 자동 저장합니다. 이전 답안은 불러오기 버튼으로 복원하세요.');
  const correct = (id: string) => accepted[id] || matches(answers[id] ?? '', content.questions.find(q => q.id === id)!.answers);
  const score = content.questions.filter(q => correct(q.id)).length * 4;
  const answered = content.questions.filter(q => answers[q.id]?.trim()).length;

  function save(next: Record<string, string>) {
    setAnswers(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setMessage('이 브라우저에 답안을 저장했습니다.');
    } catch { setMessage('브라우저 저장이 차단되어 있습니다. 창을 닫으면 입력한 답안이 사라집니다.'); }
  }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(key) ?? '{}');
      const next = Object.fromEntries(content.questions.map(q => [q.id, typeof raw?.[q.id] === 'string' ? raw[q.id] : '']));
      setAnswers(next); setSubmitted(false); setAccepted({}); setOnlyWrong(false);
      setMessage('저장된 답안을 불러왔습니다.');
    } catch { setMessage('저장된 답안을 읽을 수 없습니다. 현재 입력은 유지합니다.'); }
  }
  function reset() {
    if (!window.confirm('현재 답안과 이 브라우저에 저장된 10월 답안을 모두 지울까요?')) return;
    save({}); setSubmitted(false); setAccepted({}); setOnlyWrong(false);
  }

  return <main className="october">
    <header className="oct-nav"><Link href="/">← 학습 홈</Link><Link href="/exam-recall/">월별 복기 아카이브</Link><Link href="/exam-prep/">전체 모의고사</Link></header>
    <h1>10월 AI Specialist 복기</h1>
    <p className="oct-lead">실습 코드 전체를 읽고, 어느 줄이 비어도 직접 완성할 수 있도록.</p>
    <p>사용자 제공 복기와 저장된 강의 코드를 대조한 정리입니다. 복기 기반 재구성 문제이며 공식 시험지·공식 정답은 아닙니다. 정리일: 2026-11-03.</p>
    <nav className="oct-actions" aria-label="학습 모드">
      <button aria-pressed={tab === 'summary'} onClick={() => setTab('summary')}>과목별 정리</button>
      <button aria-pressed={tab === 'exam'} onClick={() => setTab('exam')}>모의고사 25문항</button>
      <button onClick={() => window.print()}>현재 보기 인쇄 / PDF</button>
    </nav>
    <div className="oct-downloads">다운로드: <a href={`${basePath}/october/summary.md`} download>복기 정리</a> · <a href={`${basePath}/october/mock-exam.md`} download>문제지</a> · <a href={`${basePath}/october/answers.md`} download>정답·해설</a></div>
    {tab === 'summary' ? <>
      <nav className="oct-actions" aria-label="과목 목차">{subjects.map(s => <a key={s} href={`#oct-${s}`}>{s}</a>)}</nav>
      {subjects.map(subject => <section key={subject} id={`oct-${subject}`}><h2>{subject}</h2>{content.topics.filter(t => t.subject === subject).map(t => <article key={t.title} className="oct-card">
        <h3>{t.title}</h3><p className="oct-meta">{t.source} · 셀 번호는 Markdown 포함 1부터</p>
        <ul>{t.notes.map(n => <li key={n}>{n}</li>)}</ul><pre><code>{t.code}</code></pre>
      </article>)}</section>)}
      <aside className="oct-card"><h2>복습 순서</h2><p>먼저 위 코드의 변수·축·차원·호출 순서를 설명해 보세요. 다음으로 모의고사에서 코드를 작성하고, 틀린 부분은 해당 노트북의 함수 전체로 돌아가 확인하세요. 여기에 나온 빈칸 외의 인접 코드도 함께 공부하세요.</p><button onClick={() => {setTab('exam'); window.scrollTo({top:0});}}>모의고사 시작</button></aside>
    </> : <>
      <section className="oct-card"><h2>10월 복기 모의고사</h2><p>권장 60분 · 25문항 × 4점 = 100점. 시간·배점은 학습용 설계입니다. LLM 7 · RAG 6 · Vision 4 · Data 3 · On-device 5문항으로 복기의 코드 범위를 나누었습니다.</p>
        <p>각 코드의 【빈칸】에 들어갈 부분만 작성하세요. 정답과 해설은 일괄 제출 후 표시합니다. 자동 채점은 공백·단순 따옴표·끝 쉼표 차이를 허용하지만 코드를 실행하지 않으므로 의미가 같은 다른 답은 직접 인정할 수 있습니다. 실행 가능 여부와 들여쓰기는 정답 코드로 다시 확인하세요.</p>
        <div className="oct-actions"><button onClick={load}>저장 답안 불러오기</button><button onClick={reset}>답안 초기화</button></div>
        <p role="status">{message}</p><p>작성: {answered} / 25문항</p>
        {submitted && <div aria-live="polite"><h3>점수: {score} / 100</h3><ul>{subjects.map(subject => {
          const qs = content.questions.filter(q => q.subject === subject);
          return <li key={subject}>{subject}: {qs.filter(q => correct(q.id)).length} / {qs.length}문항</li>;
        })}</ul><label><input type="checkbox" checked={onlyWrong} onChange={e => setOnlyWrong(e.target.checked)} /> 오답만 보기</label><p>직접 인정한 답안은 이번 결과에 반영되며 다시 채점할 때 초기화됩니다.</p></div>}
      </section>
      {content.questions.map((q, i) => submitted && onlyWrong && correct(q.id) ? null : <article key={q.id} className="oct-card">
        <h2>{i + 1}. {q.subject} · {q.title} <small>4점</small></h2><p>{q.prompt}</p><pre><code>{q.code}</code></pre>
        <label htmlFor={q.id}>답안</label><textarea id={q.id} spellCheck={false} rows={Math.max(3, q.answers[0].split('\n').length + 1)} value={answers[q.id] ?? ''} readOnly={submitted} onChange={e => save({...answers, [q.id]:e.target.value})} />
        {submitted && <div className="oct-result"><strong>{correct(q.id) ? '정답' : '오답'}{accepted[q.id] ? ' (직접 인정)' : ''}</strong><h3>기준 답안</h3><pre><code>{q.answers[0]}</code></pre><p>{q.explanation}</p><p className="oct-meta">{q.source}</p>
          {!matches(answers[q.id] ?? '', q.answers) && !!answers[q.id]?.trim() && <label><input type="checkbox" checked={accepted[q.id] ?? false} onChange={e => setAccepted({...accepted, [q.id]:e.target.checked})} /> 의미가 같은 답안으로 직접 인정</label>}
        </div>}
      </article>)}
      <div className="oct-actions">{submitted ? <button onClick={() => {setSubmitted(false); setAccepted({}); setOnlyWrong(false);}}>답안 수정 후 다시 풀기</button> : <button onClick={() => {setSubmitted(true); setAccepted({}); window.scrollTo({top:0});}}>전체 제출 · 채점 ({answered}/25 작성)</button>}</div>
    </>}
  </main>;
}
