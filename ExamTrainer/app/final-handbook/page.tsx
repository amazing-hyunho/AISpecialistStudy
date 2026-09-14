'use client';

import Link from 'next/link';
import { useState } from 'react';
import bank from '../question-bank.json';
import { finalTopics } from './topics';
import '../handbook/handbook.css';

const cells = bank.cells as Record<string, { cell: number; source: string; answerSource: string; sourceKind?: string }>;
const cards = finalTopics.map(topic => ({ ...topic, questions: topic.ids.map(id => {
  const q = bank.questions.find(q => q.id === id);
  if (!q || cells[q.sourceId].sourceKind === 'reconstructed') throw new Error(`최종 핸드북 출처 오류: ${id}`);
  return q;
}) }));

export default function FinalHandbook() {
  const [hidden, setHidden] = useState(false);
  return <main className="handbook">
    <header className="hb-top"><Link href="/">← 학습 홈</Link><Link href="/handbook/">전체 핸드북</Link><button onClick={() => window.print()}>인쇄 / PDF 저장</button></header>
    <h1>시험 직전 · 찐 암기 핸드북</h1>
    <p className="hb-intro">제가 출제한다면 먼저 확인할 핵심 14개입니다. 1~10을 먼저 읽고, 여유가 있으면 11~14까지 확인하세요.</p>
    <aside className="hb-flow"><strong>선별 기준</strong><p>알려주신 이전 기출 + AI인증시험 출제포인트의 핵심 흐름 + 실제 강의 코드. 출제 확률이나 적중을 보장하는 목록은 아닙니다.</p><p>읽기 → 답안을 가리고 순서 말하기 → 코드 직접 떠올리기. 여러 셀의 발췌는 하나의 실행 코드가 아니므로 출처를 구분해서 보세요.</p></aside>
    <div className="hb-controls"><button aria-pressed={hidden} onClick={() => setHidden(value => !value)}>{hidden ? '정답 코드 펼치기' : '정답 코드 가리고 암기 확인'}</button><span>{hidden ? '정답을 가린 상태입니다. 인쇄할 때도 가려집니다.' : '정답을 펼친 상태입니다. 이대로 인쇄하면 답안 핸드북이 됩니다.'}</span></div>
    <nav className="hb-index" aria-label="최종 암기 목차">{cards.map((card, i) => <a key={card.title} href={`#final-${i}`}>{i + 1}. {card.title}</a>)}</nav>
    {cards.map((card, index) => <section className="hb-cell" id={`final-${index}`} key={card.title}>
      <p className="hb-meta">{index < 10 ? '먼저 암기' : '추가 확인'} · {card.subject}</p>
      <h2>{index + 1}. {card.title}</h2>
      <p>{card.reason}</p>
      <p className="hb-sequence"><strong>입으로 외울 순서</strong><br />{card.flow}</p>
      <ol className="hb-steps">{card.questions.map(q => <li key={q.id}>
        <h4>{q.topic}</h4><p>{q.prompt}</p>
        {hidden ? <p>### 공개 제한 ###</p> : <pre><code>{q.answer}</code></pre>}
        <p className="hb-meta">{cells[q.sourceId].answerSource} · Cell {cells[q.sourceId].cell}</p>
      </li>)}</ol>
      <p className="hb-memory"><strong>틀리기 쉬운 점</strong><br />{card.trap}</p>
      {!hidden && [...new Set(card.questions.map(q => q.sourceId))].map(id => <details key={id}><summary>원문 확인 · {cells[id].answerSource} · Cell {cells[id].cell}</summary><pre><code>{cells[id].source}</code></pre></details>)}
      <a className="hb-back" href="#">↑ 목차로</a>
    </section>)}
    <footer className="hb-footer">기존 강의 답안의 핵심 구간만 선별 · 재구성 DPO 예제 제외 · 문법이 다른 동등 구현보다 강의 코드 기준으로 암기</footer>
  </main>;
}
