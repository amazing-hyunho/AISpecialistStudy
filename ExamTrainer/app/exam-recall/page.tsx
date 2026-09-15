'use client';

import Link from 'next/link';
import { useState } from 'react';
import { originalRecall } from './original';
import '../handbook/handbook.css';

const sections = [
  { title: '총평', marker: '총평:' },
  { title: 'LLM', marker: '### LLM' },
  { title: 'RAG', marker: '### RAG' },
  { title: 'Time / Data', marker: '### Time' },
  { title: 'Vision', marker: 'VISION - CIFAR10' },
  { title: 'On-device', marker: '### On-Device' },
].map((section, i, all) => ({
  ...section,
  text: originalRecall.slice(originalRecall.indexOf(section.marker), all[i + 1] ? originalRecall.indexOf(all[i + 1].marker) : undefined).trim(),
}));

export default function ExamRecall() {
  const [raw, setRaw] = useState(false);
  return <main className="handbook">
    <header className="hb-top"><Link href="/">← 문제은행</Link><Link href="/final-handbook/">암기 핸드북</Link><button onClick={() => window.print()}>인쇄 / PDF 저장</button></header>
    <h1>2026-09 시험 복기</h1>
    <p className="hb-intro">직접 적어주신 복기를 별도로 보관한 탭입니다. 공식 시험지·공식 정답이 아닌 사용자 기억 기반 기록입니다.</p>
    <aside className="hb-flow"><strong>원문과 해설 구분</strong><p>내용·불확실한 표현·코드 표기를 임의로 고치지 않았습니다. 기본 보기는 밑줄 등의 Markdown 이스케이프만 풀어 읽기 쉽게 표시하며, 원문 보기에서는 전달된 표기를 확인할 수 있습니다. 문법과 들여쓰기가 불완전한 부분도 있어 그대로 실행할 수 있는 코드라는 뜻은 아닙니다.</p></aside>
    <div className="hb-controls"><button aria-pressed={raw} onClick={() => setRaw(value => !value)}>{raw ? '과목별 읽기 보기' : '원문 전체 보기'}</button></div>
    {raw ? <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{originalRecall}</pre> : <>
      <nav className="hb-index" aria-label="복기 과목 목차">{sections.map((section, i) => <a key={section.title} href={`#recall-${i}`}>{section.title}</a>)}</nav>
      {sections.map((section, i) => <section className="hb-cell" id={`recall-${i}`} key={section.title}>
        <h2>{section.title}</h2>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{section.text.replace(/\\([_~*#])/g, '$1')}</pre>
        <a className="hb-back" href="#">↑ 목차로</a>
      </section>)}
    </>}
    <footer className="hb-footer">사용자 제공 복기 원문 보관 · 문제은행 보강과 암기 해설은 별도 페이지에서 관리합니다.</footer>
  </main>;
}
