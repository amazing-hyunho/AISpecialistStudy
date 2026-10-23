'use client';

import { useEffect, useRef, useState } from 'react';
import { practiceChoices, maskedCell, type BankQuestion } from './choice-practice-data';
import { shuffle } from './multiple-choice/questions';
import { studySupport } from './study-support';

export default function ChoicePractice({ question, source, onContinue }: {
  question: BankQuestion; source: string; onContinue: () => void;
}) {
  const [choices] = useState(() => shuffle(practiceChoices(question)));
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const feedback = useRef<HTMLHeadingElement>(null);
  const codePanel = useRef<HTMLPreElement>(null);
  const blankMarker = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!collapsed && codePanel.current && blankMarker.current) {
      codePanel.current.scrollTop = Math.max(0, blankMarker.current.offsetTop - codePanel.current.clientHeight / 2);
    }
  }, [collapsed]);
  const code = maskedCell(question, source);
  const support = studySupport(question);
  function grade() {
    if (selected === null || checked) return;
    setChecked(true);
    requestAnimationFrame(() => feedback.current?.focus());
  }
  function continueWriting() { setCollapsed(true); onContinue(); }
  return <section className="choice-practice" aria-label="객관식 먼저 풀기" onKeyDown={event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.stopPropagation();
      event.preventDefault();
      if (event.nativeEvent?.isComposing || event.repeat) return;
      if (checked || collapsed) continueWriting(); else grade();
    }
  }}>
    <div className="choice-practice-heading"><h2>1. 코드 빈칸을 4지선다로 먼저 풀기</h2>
      {collapsed && <button className="text-button" onClick={() => setCollapsed(false)}>객관식 다시 보기</button>}
    </div>
    {collapsed ? <p>보기를 접었어요. 아래 같은 빈칸에 직접 입력해 보세요. 답안은 자동으로 채워지지 않습니다.</p> : <>
      <p>현재 선택한 빈칸 · {question.topic}. 아래 <strong>【빈칸】</strong>에 들어갈 <strong>강의자료 원문 답안</strong>을 고르세요. 기능이 같은 다른 표현까지 판단하는 문제는 아닙니다.</p>
      <pre className="choice-context" ref={codePanel} style={{ position: 'relative' }}><code>{code.before}<mark ref={blankMarker}>【빈칸 · ### 공개 제한 ###】</mark>{code.after}</code></pre>
      <fieldset className="choice-options" disabled={checked}><legend>보기 하나 선택</legend>
        {choices.map((choice, i) => <label key={choice.id} className={`choice-option ${selected === choice.id ? 'selected' : ''} ${checked && choice.correct ? 'correct' : ''} ${checked && selected === choice.id && !choice.correct ? 'wrong' : ''}`}>
          <input type="radio" name={`practice-${question.id}`} checked={selected === choice.id} onChange={() => setSelected(choice.id)} />
          <span>{i + 1}.</span><code>{choice.text}</code>
          {checked && choice.correct && <strong>정답</strong>}
          {checked && selected === choice.id && !choice.correct && <strong>내 선택 · 오답</strong>}
        </label>)}
      </fieldset>
      {checked && <div className="choice-explanation">
        <h3 ref={feedback} tabIndex={-1}>{choices.find(c => c.id === selected)?.correct ? '✓ 정답! 이제 직접 써볼 차례예요.' : '정답과 개념을 확인하고 직접 써보세요.'}</h3>
        <p>{support.concept}</p><p>흐름: {support.flow}</p>
        {choices.map((choice, i) => <p key={choice.id}><strong>{i + 1}번 · {choice.correct ? '정답' : '비교 보기'}</strong> — {choice.reason}</p>)}
        <p>주의: {support.caution}</p>
      </div>}
      <div className="choice-practice-actions">
        {!checked && <button className="primary-button" disabled={selected === null} onClick={grade}>객관식 정답 확인</button>}
        <button className={checked ? 'primary-button' : 'text-button'} onClick={continueWriting}>{checked ? '보기 접고 아래 주관식 풀기 ↓' : '바로 주관식 풀기 ↓'}</button>
        <span>Ctrl + Enter: {checked ? '주관식으로 이동' : '객관식 채점'} · 객관식 연습은 주관식 완료·오답 기록에 반영하지 않습니다.</span>
      </div>
    </>}
  </section>;
}
