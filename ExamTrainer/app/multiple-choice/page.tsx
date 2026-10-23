'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { questions, subjects, shuffle } from './questions';
import { readProgress, recordAnswer, STORAGE_KEY, type Progress } from './progress';
import bank from '../question-bank.json';
import './quiz.css';

type Question = typeof questions[number];
type Round = { question: Question; choices: Question['choices'] };
export default function MultipleChoice() {
  const [progress, setProgress] = useState<Progress>({ wrong: [], solved: [] });
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [round, setRound] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [title, setTitle] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setProgress(readProgress(localStorage.getItem(STORAGE_KEY), questions.map(q => q.id))); }
      catch { setStorageError(true); }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch {
      const frame = requestAnimationFrame(() => setStorageError(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [progress, ready]);

  function start(items: Question[], label: string) {
    if (!items.length) return;
    setRound(items.map(question => ({ question, choices: shuffle(question.choices) })));
    setTitle(label); setIndex(0); setSelected(null); setChecked(false); setScore(0); setFinished(false);
    requestAnimationFrame(() => heading.current?.focus());
  }
  const current = round[index];
  const q = current?.question;
  function grade() {
    if (!q || selected === null || checked || finished) return;
    const correct = q.choices.find(choice => choice.id === selected)!.correct;
    setChecked(true);
    if (correct) setScore(previous => previous + 1);
    setProgress(previous => recordAnswer(previous, q.id, correct));
    requestAnimationFrame(() => reviewHeading.current?.focus());
  }
  function next() {
    if (!checked) return;
    if (index + 1 === round.length) setFinished(true);
    else { setIndex(index + 1); setSelected(null); setChecked(false); }
    requestAnimationFrame(() => heading.current?.focus());
  }
  const wrongQuestions = questions.filter(question => progress.wrong.includes(question.id));
  return <main className="app-shell mc-shell" onKeyDown={event => {
    if (event.nativeEvent.isComposing || event.repeat || finished || !round.length) return;
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (checked) next(); else grade();
    }
  }}>
    <header className="mc-header"><Link href="/">← 빈칸 문제은행</Link>
      {!!round.length && <button className="text-button" onClick={() => setRound([])}>객관식 과목 선택</button>}
    </header>
    {storageError && <p role="alert">이 브라우저에서 기록 저장을 사용할 수 없습니다. 현재 화면에서는 풀 수 있지만 새로고침하면 기록이 사라질 수 있어요.</p>}
    {!round.length ? <>
      <span className="eyebrow">MULTIPLE CHOICE · 핵심 30문항</span>
      <h1>코드를 읽고, 이유를 고르세요.</h1>
      <p>기존 문제은행에서 고른 과목별 6문항입니다. 원문 정답 코드는 그대로 사용하고, 객관식용 질문·오답 보기를 추가했습니다. 실제 시험 기출이라고 단정한 문항은 아닙니다.</p>
      <p>보기는 시작할 때마다 섞입니다. 채점 후 네 보기의 이유와 원본 셀을 확인하세요.</p>
      <div className="mc-subjects">{subjects.map(subject => {
        const items = questions.filter(question => question.subject === subject);
        return <button className="mc-subject" disabled={!ready} key={subject} onClick={() => start(items, subject)}>
          <strong>{subject}</strong><span>{items.length}문항 · 정답 경험 {items.filter(question => progress.solved.includes(question.id)).length}</span>
          <span>객관식 풀기 →</span>
        </button>;
      })}</div>
      <section className="mc-notes"><h2>객관식 오답노트 · {wrongQuestions.length}문항</h2>
        <p>빈칸 문제 기록과 별도로 이 브라우저에 저장합니다. 다시 맞혀도 직접 ‘오답 해결’을 누르기 전까지 남아 있으며, 일반 과목 학습에서도 계속 출제됩니다.</p>
        <button className="primary-button" disabled={!ready || !wrongQuestions.length} onClick={() => start(wrongQuestions, '객관식 오답 복습')}>오답 전체 복습</button>
        <div className="mc-note-links">{subjects.map(subject => <button className="text-button" key={subject} disabled={!ready || !wrongQuestions.some(question => question.subject === subject)} onClick={() => start(wrongQuestions.filter(question => question.subject === subject), `${subject} 오답 복습`)}>{subject} 오답</button>)}</div>
      </section>
    </> : finished ? <section className="mc-card">
      <span className="eyebrow">{title} · 완료</span>
      <h1 ref={heading} tabIndex={-1}>이번 결과: {score} / {round.length}</h1>
      <p>틀린 문항은 객관식 오답노트에 저장했습니다. 보기를 바꾸어 다시 풀며 코드의 이유까지 떠올려 보세요.</p>
      <div className="mc-controls"><button className="primary-button" onClick={() => start(round.map(item => item.question), title)}>보기 섞어서 다시 풀기</button><button className="text-button" onClick={() => setRound([])}>과목 선택</button></div>
    </section> : <section className="mc-card">
      <span className="eyebrow">{title} · {index + 1} / {round.length} · {q.topic}</span>
      <h1 ref={heading} tabIndex={-1}>{q.prompt}</h1>
      <p className="mc-source">출처: {q.file} · Cell {(bank.cells as Record<string, { cell: number }>)[q.sourceId].cell} · 원문 문항 {q.id.replace('mc-', '')}</p>
      <fieldset className="mc-choices" disabled={checked}><legend>정답 하나를 선택하세요</legend>
        {current.choices.map((choice, position) => <label key={choice.id} className={`mc-option ${selected === choice.id ? 'selected' : ''} ${checked ? choice.correct ? 'correct' : selected === choice.id ? 'wrong' : '' : ''}`}>
          <input type="radio" name="answer" value={choice.id} checked={selected === choice.id} onChange={() => setSelected(choice.id)} />
          <span>{position + 1}.</span><code>{choice.text}</code>
          {checked && choice.correct && <strong>정답</strong>}
          {checked && !choice.correct && selected === choice.id && <strong>내 선택 · 오답</strong>}
        </label>)}
      </fieldset>
      {checked && <section className="mc-review" aria-label="보기별 해설">
        <p role="status">{q.choices.find(choice => choice.id === selected)?.correct ? '✓ 정답입니다!' : '오답입니다. 객관식 오답노트에 저장했어요.'}</p>
        <h2 ref={reviewHeading} tabIndex={-1}>왜 맞고, 왜 틀릴까요?</h2>
        {current.choices.map((choice, position) => <div key={choice.id}><h3>{position + 1}번 · {choice.correct ? '정답' : '오답 보기'}{selected === choice.id ? ' · 내 선택' : ''}</h3><p>{choice.reason}</p></div>)}
        <details key={q.id}><summary>원본 코드 셀 확인</summary><pre><code>{(bank.cells as Record<string, { source: string }>)[q.sourceId].source}</code></pre></details>
        {progress.wrong.includes(q.id) && q.choices.find(choice => choice.id === selected)?.correct && <button className="text-button" onClick={() => setProgress(previous => ({ ...previous, wrong: previous.wrong.filter(id => id !== q.id) }))}>이 문항 오답 해결</button>}
      </section>}
      <div className="mc-controls"><span>Ctrl + Enter: {checked ? '다음으로' : '정답 확인'} · 방향키: 보기 선택</span>
        {!checked ? <button className="primary-button" disabled={selected === null} onClick={grade}>정답 확인</button> : <button className="primary-button" onClick={next}>{index + 1 === round.length ? '결과 보기' : '다음 문제 →'}</button>}
      </div>
    </section>}
  </main>;
}
