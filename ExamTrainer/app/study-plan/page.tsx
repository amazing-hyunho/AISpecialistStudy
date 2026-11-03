'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import plan from './plan.json';
import inventory from './inventory.json';
import { dayDate, dateLabel, parseProgress, validDate, type Progress } from './schedule';
import './plan.css';

const key = 'ai-specialist-10-day-plan-v1';
const changeEvent = 'study-plan-change';
let memory = '';
let storageFailed = false;
function snapshot() {
  if (storageFailed) return memory;
  try { return localStorage.getItem(key) ?? ''; } catch { return memory; }
}
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(changeEvent, callback);
  return () => {window.removeEventListener('storage', callback); window.removeEventListener(changeEvent, callback);};
}
const serverSnapshot = () => '';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function StudyPlan() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const progress = parseProgress(raw);
  const [notice, setNotice] = useState('시작일·완료 체크·메모는 이 브라우저에 저장됩니다. 기기 간 동기화는 하지 않습니다.');
  const completed = plan.days.filter(d => d.checks.every((_, i) => progress.checked[`${d.day}-${i}`])).length;
  const checked = Object.values(progress.checked).filter(Boolean).length;
  function save(next: Progress) {
    memory = JSON.stringify(next);
    try { localStorage.setItem(key, memory); setNotice('이 브라우저에 저장했습니다.'); }
    catch { storageFailed = true; setNotice('브라우저 저장이 차단되어 이번 화면에서만 유지됩니다. 새로고침 전 메모를 복사해 주세요.'); }
    window.dispatchEvent(new Event(changeEvent));
  }
  return <main className="study-plan">
    <header className="plan-nav"><Link href="/">← 학습 홈</Link><Link href="/october-recall/">10월 복기·모의고사</Link><Link href="/exam-prep/">전체 문제은행</Link></header>
    <section className="plan-hero">
      <p className="plan-eyebrow">AI SPECIALIST · 10 DAY STUDY PLAN</p>
      <h1>읽고, 직접 쓰고,<br/>다시 풀어보는 10일.</h1>
      <p className="plan-lead">강의 실습과 출제포인트를 연결한 하루 3시간 커리큘럼.<br/>LLM → RAG → Data → Vision → On-device → 실전 모의고사.</p>
      <div className="plan-stats"><div><strong>10일</strong><span>시작일 변경 가능</span></div><div><strong>30시간</strong><span>하루 180분 · 휴식 별도</span></div><div><strong>5과목</strong><span>범위 전체 회독</span></div><div><strong>2회</strong><span>10월 + 전 범위 모의고사</span></div></div>
    </section>
    <section className="plan-toolbar" aria-label="스케줄 설정">
      <form onSubmit={e => {e.preventDefault(); const start = String(new FormData(e.currentTarget).get('start') ?? ''); if(validDate(start))save({...progress,start});}}><label>시작일 <input key={progress.start} name="start" aria-label="시작일" type="date" defaultValue={progress.start} required min="2020-01-01" max="2099-12-22" /></label><button type="submit">시작일 적용</button></form>
      <p>{dateLabel(progress.start)} ~ {dateLabel(dayDate(progress.start,9))}</p>
      <button onClick={() => window.print()}>인쇄 / PDF 저장</button>
      <a href={`${basePath}/study-plan/10-day-curriculum.md`} download>커리큘럼 다운로드</a>
    </section>
    <section className="plan-progress" aria-label="학습 진행률"><div><strong>{completed} / 10일 완료</strong><span>완료 기준 {checked} / 30개</span></div><progress value={checked} max={30} aria-label="완료 기준 진행률"/><p role="status">{notice}</p></section>
    <aside className="plan-principles"><h2>이 일정의 기준</h2><p>{plan.scopeNote}</p><p>하루 3시간은 코드 기초가 있는 학습자의 집중 복습을 가정한 계획입니다. 긴 모델 학습·다운로드·외부 서버 설정은 완료 조건에서 제외했습니다. 처음 배우는 주제는 별도 보완 시간이 필요할 수 있습니다.</p><p>각 날은 회상 복습 → 강의/함수 전체 읽기 → 자료를 닫고 구현 → 자가 점검으로 진행합니다. 80%는 학습용 목표입니다. 시간이 부족하면 ‘여유 60분’ 항목을 생략하고, 오답은 다음 날 복습 시간에 먼저 처리하세요.</p></aside>
    <section aria-labelledby="plan-overview"><h2 id="plan-overview">10일 한눈에 보기</h2><div className="plan-overview">{plan.days.map(d => <a href={`#day-${d.day}`} key={d.day}><span>DAY {String(d.day).padStart(2,'0')} · {dateLabel(dayDate(progress.start,d.day-1))}</span><strong>{d.title}</strong><small>{d.subjects.length === 5 ? '전 과목' : d.subjects.join(' · ')}</small></a>)}</div></section>
    <section aria-labelledby="daily-detail"><h2 id="daily-detail">매일 할 일</h2><p>셀 번호는 Markdown 셀을 포함해 1부터 센 위치입니다. 노트북 버전이 달라지면 함수/검색어로 찾으세요. 자료 경로는 현재 프로젝트 기준이며 원본 강의 파일을 공개 업로드하지 않았습니다.</p>
      {plan.days.map(d => <article id={`day-${d.day}`} key={d.day} className="plan-day">
        <header><div className="plan-day-number">DAY {String(d.day).padStart(2,'0')}</div><div><p>{dateLabel(dayDate(progress.start,d.day-1))} · 180분</p><h3>{d.title}</h3></div><span className="plan-day-status">{d.checks.every((_, i) => progress.checked[`${d.day}-${i}`]) ? '완료' : '학습'}</span></header>
        <p className="plan-goal">{d.goal}</p>
        <ol className="plan-blocks">{d.blocks.map((b,i) => <li key={b.label}><div><span>{String(i+1).padStart(2,'0')}</span><strong>{b.label}</strong><em>{b.minutes}분</em></div><p>{b.task}</p></li>)}</ol>
        <details className="plan-sources"><summary>확인할 강의 파일·셀·함수 ({d.sources.length}개)</summary><ul>{d.sources.map(s => <li key={s.path}><code>{s.path}</code>{s.cells.length > 0 && <p>셀 {s.cells.join(' · ')}</p>}{s.find.length > 0 && <p>검색어: {s.find.join(' · ')}</p>}</li>)}</ul></details>
        <fieldset className="plan-checks"><legend>오늘의 완료 기준</legend>{d.checks.map((check,i) => <label key={check}><input type="checkbox" checked={progress.checked[`${d.day}-${i}`] ?? false} onChange={e => save({...progress,checked:{...progress.checked,[`${d.day}-${i}`]:e.target.checked}})} />{check}</label>)}</fieldset>
        <label className="plan-notes">오답·점수·다음 복습 메모<textarea rows={2} placeholder="예: MCP await 위치 2개 오답 / 내일 다시 작성" value={progress.notes[d.day] ?? ''} onChange={e => save({...progress,notes:{...progress.notes,[d.day]:e.target.value}})} /></label>
        <nav className="plan-practice" aria-label={`Day ${d.day} 학습 링크`}>{d.practice.map(p => <Link href={p.href} key={p.label}>{p.label} →</Link>)}</nav>
        <p className="plan-extra">{d.extra}</p>
      </article>)}
    </section>
    <section className="plan-evidence"><h2>출제 범위 ↔ 일정 대응</h2><p>PDF의 요구사항은 아래와 같고, 세부 모델·함수의 우선순위는 강의 코드와 개인 복기를 바탕으로 정했습니다.</p><div className="plan-table-wrap"><table><thead><tr><th>과목</th><th>저장된 출제포인트</th><th>학습일</th><th>배치 이유</th></tr></thead><tbody>{plan.coverage.map(c => <tr key={c.subject}><th>{c.subject}</th><td>{c.scope}</td><td>{c.days.map(d => <a href={`#day-${d}`} key={d}>D{d} </a>)}</td><td>{c.reason}</td></tr>)}</tbody></table></div>
      <details><summary>검토한 프로젝트 자료 목록</summary><p>확인일 {plan.reviewed} · 노트북 {inventory.notebooks}개 · PDF {inventory.pdfs}개. 사본·연습/정답·Colab 버전도 포함한 파일 수이며 서로 다른 강의 개수가 아닙니다.</p><p>출제 범위 근거: Study/AI인증시험_출제포인트.pdf (1페이지). 복기 근거: ExamTrainer/PAST_EXAMS_STUDY_GUIDE.md, app/exam-recall/original.ts, app/october-recall/content.json. 노트북은 코드 셀과 함수 위치를 확인했고, 모든 강의 PDF 본문을 정독한 목록은 아닙니다.</p><ul>{inventory.subjects.map(s => <li key={s.subject}><strong>{s.subject}</strong> — 노트북 {s.notebooks}개 · PDF {s.pdfs}개</li>)}</ul><ul className="plan-file-list">{inventory.files.map(f => <li key={f}>{f}</li>)}</ul></details>
    </section>
    <footer className="plan-footer">스케줄만 제공합니다. 캘린더 일정·알림을 자동 등록하지 않습니다. <Link href="/">학습 홈으로 돌아가기 →</Link></footer>
  </main>;
}
