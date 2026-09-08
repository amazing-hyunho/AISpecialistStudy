'use client';

import Link from 'next/link';
import { useState } from 'react';
import bank from '../question-bank.json';
import { questionExplanations } from '../explanations';
import './handbook.css';

const flows: Record<string, string> = {
  LLM: '텍스트 → 토큰·학습 데이터 → 임베딩 → Attention·GPT → 손실·학습 → 미세조정·DPO',
  RAG: '문서 준비 → 인덱스 구성 → 검색 → 검색 결과 정리 → 프롬프트 → 응답·평가',
  Data: '데이터 구성 → 모델 입력 → 모델 출력 → 손실 → 가중치 갱신 → 평가',
  Vision: '이미지 변환 → 모델·주요 레이어 → 예측 → 정답과 비교 → 학습·평가',
  'On-device': '양자화: scale·round·zero point / 프루닝: importance·threshold·mask / 증류: teacher·student·loss',
};
const cells = bank.cells as Record<string, { source: string; cell: number; answerSource: string }>;
type Question = typeof bank.questions[number];
function offset(q: Question) {
  let start = 0;
  let found = 0;
  for (let i = 0; i <= q.occurrence; i++) {
    found = cells[q.sourceId].source.indexOf(q.answer, start);
    start = found + q.answer.length;
  }
  return found;
}

export default function Handbook() {
  const [subject, setSubject] = useState('LLM');
  const [chapterId, setChapterId] = useState(bank.chapters[0].id);
  const [starOnly, setStarOnly] = useState(false);
  const chapters = bank.chapters.filter(c => c.subject === subject);
  const chapter = chapters.find(c => c.id === chapterId) ?? chapters[0];
  const entries = bank.questions.filter(q => q.chapterId === chapter.id && (!starOnly || q.isSourceBlank));
  const groups = [...new Set(entries.map(q => q.sourceId))]
    .sort((a, b) => cells[a].cell - cells[b].cell)
    .map(id => ({ id, ...cells[id], questions: entries.filter(q => q.sourceId === id).sort((a, b) => offset(a) - offset(b)) }));

  return <main className="handbook">
    <header className="hb-top"><Link href="/">← 문제은행</Link><button onClick={() => window.print()}>인쇄 / PDF 저장</button></header>
    <h1>읽는 암기 핸드북</h1>
    <p className="hb-intro">이동 중에도 입력 없이 읽어보세요. 셀마다 핵심 코드와 암기 포인트를 순서대로 모았습니다.</p>
    <nav className="hb-subjects" aria-label="핸드북 과목">
      {Object.keys(flows).map(name => <button key={name} aria-pressed={subject === name} onClick={() => {
        setSubject(name); setChapterId(bank.chapters.find(c => c.subject === name)!.id);
      }}>{name}</button>)}
    </nav>
    <div className="hb-controls">
      <label>챕터 <select value={chapter.id} onChange={e => setChapterId(e.target.value)}>
        {chapters.map(c => <option key={c.id} value={c.id}>{c.number} · {c.title}</option>)}
      </select></label>
      <label><input type="checkbox" checked={starOnly} onChange={e => setStarOnly(e.target.checked)} /> ★ 원본 빈칸만</label>
    </div>
    <aside className="hb-flow"><strong>{subject} 큰 흐름</strong><p>{flows[subject]}</p></aside>
    <h2>{chapter.title}</h2>
    <p className="hb-meta">{chapter.file} · {groups.length}개 셀 · {entries.length}개 암기 포인트</p>
    <p className="hb-meta">★는 현재 실습본의 빈칸 표시입니다. 셀 번호는 아래 정답 출처 기준이며 실행 번호와 다를 수 있습니다.</p>
    <nav className="hb-index" aria-label="셀 목차">{groups.map(g => <a key={g.id} href={`#${g.id}`}>Cell {g.cell}</a>)}</nav>
    {groups.length === 0 && <p className="hb-empty">이 챕터에는 별표 문제가 없습니다. ‘★ 원본 빈칸만’을 해제하면 PDF 기준으로 선별한 코드를 볼 수 있어요.</p>}
    {groups.map((g, index) => <section className="hb-cell" id={g.id} key={g.id}>
      <div className="hb-cell-heading"><h3>Cell {g.cell}</h3><span>셀 {index + 1}/{groups.length}</span></div>
      <p className="hb-meta">정답 출처: {g.answerSource}</p>
      <p className="hb-sequence">{g.questions.map(q => q.topic).join(' → ')}</p>
      <ol className="hb-steps">{g.questions.map(q => <li key={q.id}>
        <h4>{q.isSourceBlank ? '★ ' : ''}{q.topic}</h4>
        <p>{q.prompt}</p>
        <pre><code>{q.answer}</code></pre>
        {questionExplanations[q.id] && <p className="hb-memory"><strong>기억하기</strong> {questionExplanations[q.id].memory}</p>}
      </li>)}</ol>
      <details><summary>전체 코드 셀 펼쳐 보기</summary><pre><code>{g.source}</code></pre></details>
      <a className="hb-back" href="#">↑ 목차로</a>
    </section>)}
    <footer className="hb-footer">현재 문제은행에 수록된 코드 기준 · 같은 셀의 포인트를 모아 읽는 복습용 핸드북</footer>
  </main>;
}
