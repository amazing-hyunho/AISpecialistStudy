'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { monthlyBanks, topicBanks, monthlyExams, predictedExams, prepQuestions, cellParts, cellQuestions, choicePreview, subjects, isCorrect, results, type Collection } from './data';
import './prep.css';

type ItemProgress = { selected?: number; checked?: boolean; writing?: boolean; answer?: string; graded?: boolean };
type Saved = { version: 3; index: number; items: Record<string,ItemProgress>; submitted: boolean };
const empty = (): Saved => ({version:3,index:0,items:{},submitted:false});
const storageKey = (id: string, exam: boolean) => `ai-monthly-prep-v3:${exam ? 'exam' : 'bank'}:${id}`;
function readSaved(collection: Collection, exam: boolean): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(collection.id,exam)) ?? 'null');
    if (!raw || raw.version !== 3 || typeof raw.items !== 'object' || !raw.items) return empty();
    const items: Saved['items'] = {};
    for (const id of collection.questionIds) {
      const item = raw.items[id];
      if (!item || typeof item !== 'object') continue;
      items[id] = {selected: Number.isInteger(item.selected) && item.selected >= 0 && item.selected < 4 ? item.selected : undefined,
        checked:item.checked === true,writing:item.writing === true,answer:typeof item.answer === 'string' ? item.answer : '',graded:item.graded === true};
    }
    return {version:3,items,index:Number.isInteger(raw.index) ? Math.max(0,Math.min(collection.questionIds.length-1,raw.index)) : 0,submitted:exam && raw.submitted === true};
  } catch { return empty(); }
}

export default function ExamPrep() {
  const [active,setActive] = useState<{collection:Collection; exam:boolean; initial:Saved; key:number} | null>(null);
  const serial = useRef(0);
  function start(collection: Collection, exam: boolean) {
    setActive({collection,exam,initial:readSaved(collection,exam),key:++serial.current});
    window.scrollTo({top:0});
  }
  if (active) return <Session key={active.key} collection={active.collection} exam={active.exam} initial={active.initial} onHome={() => setActive(null)} />;
  function cards(collections: Collection[], exam: boolean) {
    return <div className="prep-grid">{collections.map(c => <article className="prep-card" key={c.id}>
      <h3>{c.title}</h3><p>{c.description}</p>
      <p className="prep-meta">{c.questionIds.length}문항 · {exam ? '주관식 일괄 제출' : '객관식 → 주관식'}</p>
      <button className="primary-button" onClick={() => start(c,exam)}>{exam ? '응시 / 이어서 보기' : '학습 / 이어서 풀기'} →</button>
    </article>)}</div>;
  }
  return <main className="app-shell prep-shell">
    <header className="topbar"><Link href="/">← 학습 홈</Link><Link href="/exam-recall/">9월 복기 원문</Link></header>
    <section className="prep-hero"><span className="eyebrow">4월 · 5월 · 6월 · 9월</span><h1>복기에서 연습으로,<br/>연습에서 실전으로.</h1>
      <p>문제은행에서는 객관식 확인 후 전체 셀 안에서 같은 코드를 직접 작성합니다. 모의고사는 보기를 제공하지 않으며 제출 후 정답·해설과 과목별 점수를 공개합니다.</p>
      <nav className="prep-tabs"><a href="#monthly">월별 문제은행</a><a href="#priority">예상 주제 문제은행</a><a href="#monthly-exams">월별 모의고사</a><a href="#predicted">예상 3회</a></nav>
      <p className="prep-note">개인 복기를 바탕으로 만든 연습 문제입니다. 예상 주제의 우선순위는 반복 등장과 구체적인 구현 요구를 근거로 정했으며 확률 수치가 아닙니다. 실습자료 전체 셀을 유지합니다. 원본 ????는 해당 실습의 해설 답안으로 채점합니다. 자료에 없는 복기 구현은 강의의 유사 유형으로 연습합니다.</p>
    </section>
    <section id="monthly"><h2>월별 복기 문제은행</h2><p>4월은 1차와 2차를 분리했습니다. 복기에 세부 내용이 없는 항목은 대응 연습임을 표시합니다.</p>{cards(monthlyBanks,false)}</section>
    <section id="priority"><p className="prep-note">출제포인트 기준: LLM 레이어·Tensor·학습 데이터 / RAG 흐름·llama-index·MCP / Data 모델·학습·sklearn·Metric / Vision 레이어·학습·transforms·Metric / On-device 양자화·가지치기·지식증류.</p><h2>출제 대비 예상 주제 문제은행</h2><p>‘우선’은 반복 주제 또는 9월 상세 구현, ‘보완’은 한 회차에 명시된 주제, ‘PDF 기준’은 출제포인트에 명시된 학습·평가·지식증류입니다. 주제 사이의 동일 문항은 같은 코드를 다른 맥락에서 복습하기 위한 것입니다.</p>
      {subjects.map(subject => <div className="prep-subject" key={subject}><h3>{subject}</h3>{cards(topicBanks.filter(c => c.subject === subject).map(c => ({...c,title:`${c.priority} · ${c.title}`})),false)}</div>)}
    </section>
    <section id="monthly-exams"><h2>월별 복기 모의고사 · 5회</h2><p>각 월별 문제은행의 전체 문항을 주관식으로 풉니다. 복기 범위에 맞추므로 회차별·과목별 문항 수는 다릅니다. 실제 시험 문항 수를 재현한 것은 아닙니다.</p>{cards(monthlyExams,true)}</section>
    <section id="predicted"><h2>시험 예상 모의고사 · 3회</h2><p>매회 25문항, LLM·RAG·Data·Vision·On-device 각 5문항입니다. 세 회차 전체에 24개 대비 주제를 모두 포함하고, 문항은 회차 간 중복 없이 배치했습니다.</p>{cards(predictedExams,true)}</section>
  </main>;
}

export function Session({collection,exam,initial,onHome}:{collection:Collection;exam:boolean;initial:Saved;onHome:()=>void}) {
  const [saved,setSaved] = useState<Saved>(initial);
  const [storageError,setStorageError] = useState(false);
  const [onlyWrong,setOnlyWrong] = useState(false);
  const inputs = useRef<Record<string,HTMLTextAreaElement|null>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const id = collection.questionIds[saved.index];
  const q = prepQuestions[id];
  const item = saved.items[id] ?? {};
  const answers = Object.fromEntries(collection.questionIds.map(qid => [qid,saved.items[qid]?.answer ?? '']));
  const scores = results(collection.questionIds,answers);
  const correctCount = scores.reduce((n,s) => n+s.correct,0);
  const filled = Object.values(answers).filter(a => a.trim()).length;
  const done = collection.questionIds.filter(qid => saved.items[qid]?.graded && isCorrect(qid,answers[qid])).length;
  const visibleIds = onlyWrong ? collection.questionIds.filter(qid => !isCorrect(qid,answers[qid])) : collection.questionIds;
  function update(next: Saved) {
    setSaved(next);
    try { localStorage.setItem(storageKey(collection.id,exam),JSON.stringify(next));setStorageError(false); }
    catch { setStorageError(true); }
  }
  function patch(changes: ItemProgress, target=id) { update({...saved,items:{...saved.items,[target]:{...saved.items[target],...changes}}}); }
  function go(index:number) {
    update({...saved,index});
    requestAnimationFrame(() => {heading.current?.focus();heading.current?.scrollIntoView({block:'start'});});
  }
  function reset() {
    update(empty());setOnlyWrong(false);
  }
  function enterWriting(target=id) {
    const progress = saved.items[target];
    if (progress?.selected === undefined) return;
    patch({checked:true,writing:true},target);
    requestAnimationFrame(() => {inputs.current[target]?.focus();inputs.current[target]?.scrollIntoView({block:'center'});});
  }
  function nextQuestionIndex(target=id) {
    const visiblePos = visibleIds.indexOf(target);
    if (visiblePos >= 0 && visiblePos + 1 < visibleIds.length) return collection.questionIds.indexOf(visibleIds[visiblePos + 1]);
    const pos = collection.questionIds.indexOf(target);
    return pos + 1 < collection.questionIds.length ? pos + 1 : -1;
  }
  function gradeOrAdvance(target:string, answer:string) {
    const progress = saved.items[target];
    const currentAnswer = answer || progress?.answer || '';
    if (!currentAnswer.trim()) return;
    if (progress?.graded && progress.answer === currentAnswer && isCorrect(target,currentAnswer)) {
      const next = nextQuestionIndex(target);
      if (next >= 0) go(next);
      return;
    }
    patch({answer:currentAnswer,graded:true},target);
  }
  // Stable per-question shuffle keeps restored radio selections consistent.
  const offset = [...id].reduce((n,c) => n+c.charCodeAt(0),0)%4;
  const choices = [...q.choices.slice(offset),...q.choices.slice(0,offset)];
  const reveal = exam ? saved.submitted : item.writing && item.graded;
  const choiceCorrect = q.choices.find(c => c.id === item.selected)?.correct;
  function handleSessionKey(event:{key:string;code?:string;ctrlKey?:boolean;metaKey?:boolean;altKey?:boolean;repeat?:boolean;defaultPrevented?:boolean;isComposing?:boolean;nativeEvent?:{isComposing?:boolean};target?:unknown;preventDefault?:()=>void;stopPropagation?:()=>void}) {
    if (exam || event.defaultPrevented || event.nativeEvent?.isComposing || event.isComposing || event.repeat) return;
    const targetEl = event.target as {tagName?:string;readOnly?:boolean} | undefined;
    const inWritableTextarea = targetEl?.tagName === 'TEXTAREA' && !targetEl.readOnly;
    if (!item.writing) {
      if (!inWritableTextarea && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const digit = ['1','2','3','4'].indexOf(event.key);
        const codeIdx = ['Digit1','Digit2','Digit3','Digit4','Numpad1','Numpad2','Numpad3','Numpad4'].indexOf(event.code ?? '');
        const choiceIndex = digit >= 0 ? digit : codeIdx >= 0 ? codeIdx % 4 : -1;
        if (choiceIndex >= 0 && choices[choiceIndex]) {
          event.preventDefault?.();event.stopPropagation?.();
          patch({selected:choices[choiceIndex].id,checked:true});
          return;
        }
      }
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        if (item.selected !== undefined) {
          event.preventDefault?.();event.stopPropagation?.();
          enterWriting(id);
        }
        return;
      }
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault?.();event.stopPropagation?.();
      gradeOrAdvance(id,inputs.current[id]?.value ?? item.answer ?? '');
    }
  }
  const keyHandler = useRef(handleSessionKey);
  useEffect(() => {
    keyHandler.current = handleSessionKey;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    const listener = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener('keydown',listener);
    return () => window.removeEventListener?.('keydown',listener);
  },[]);
  return <main className="app-shell prep-shell" onKeyDown={handleSessionKey}>
    <header className="topbar"><button className="text-button" onClick={onHome}>← 문제은행·모의고사 목록</button><strong>{exam ? '모의고사' : '객관식 → 주관식'}</strong></header>
    <h1>{collection.title}</h1><p>{collection.description}</p>
    <p className="prep-note">공백·들여쓰기를 제외한 예시 답안의 토큰 기준으로 채점합니다. 동등한 다른 구현까지 자동 판정하지 않습니다. 답안과 진행 단계는 이 브라우저에 자동 저장됩니다.</p>
    {storageError && <p role="alert">브라우저 저장 공간을 사용할 수 없습니다. 현재 화면에서는 계속 풀 수 있지만 새로고침하면 답안이 사라질 수 있습니다.</p>}
    <div className="prep-progress"><span>{exam ? `작성 ${filled}/${collection.questionIds.length}` : `주관식 정답 ${done}/${collection.questionIds.length}`}</span><progress max={collection.questionIds.length} value={exam ? filled : done} aria-label="풀이 진행률"/></div>
    {exam && saved.submitted && <section className="prep-result" aria-label="시험 결과">
      <h2>결과 · {correctCount}/{collection.questionIds.length}문항 ({Math.round(correctCount/collection.questionIds.length*100)}점)</h2>
      <p>문항당 같은 배점입니다. 미입력도 오답으로 집계합니다.</p>
      <div className="prep-score-grid">{scores.map(s => <p key={s.subject}><strong>{s.subject}</strong><br/>{s.correct}/{s.total}</p>)}</div>
      <button className="text-button" disabled={correctCount===collection.questionIds.length} onClick={() => {
        const next = !onlyWrong;setOnlyWrong(next);
        if (next) go(collection.questionIds.findIndex(qid => !isCorrect(qid,answers[qid])));
      }}>{onlyWrong ? '전체 문항 보기' : '오답·미입력만 보기'}</button>
      <button className="primary-button" onClick={reset}>답안 초기화하고 재응시</button>
    </section>}
    <div className="prep-workspace">
      <nav className="prep-question-nav" aria-label="문항 이동">{visibleIds.map(qid => {
        const index = collection.questionIds.indexOf(qid), progress = saved.items[qid];
        const status = (exam ? saved.submitted : progress?.graded) ? (isCorrect(qid,answers[qid]) ? '✓' : '×') : answers[qid]?.trim() ? '●' : '';
        return <button key={qid} aria-current={qid===id ? 'step' : undefined} onClick={() => go(index)}>{index+1}. {prepQuestions[qid].subject} · {prepQuestions[qid].topic} {status}</button>;
      })}</nav>
      <article className="prep-question">
        <span className="eyebrow">{saved.index+1}/{collection.questionIds.length} · {q.subject} · {q.kind}</span>
        <h2 ref={heading} tabIndex={-1}>{q.topic}</h2><p>{q.prompt}</p>
        <p className="prep-meta">{q.source}</p>
        <p>전체 셀 · 현재 세트의 빈칸 {cellQuestions(collection.questionIds,id).length}개를 코드 순서대로 표시합니다. 빈칸을 선택하면 해당 문항의 객관식·작성 가이드로 전환됩니다.</p>
        {!exam && !item.writing && <section aria-label="객관식 단계">
          <h3>1. 빈칸에 들어갈 예시 답안 고르기</h3>
          <p>현재 빈칸 주변 코드입니다. 다른 출제 빈칸도 가려두었으며, 전체 코드는 아래 셀에서 확인할 수 있습니다.</p>
          <pre className="prep-code prep-choice-preview" aria-label="객관식 코드 미리보기"><code>{choicePreview(collection.questionIds,id)}</code></pre>
          <fieldset><legend>키보드 1 · 2 · 3 · 4 또는 마우스로 보기를 고른 뒤 Ctrl + Enter로 주관식으로 넘어가세요</legend>{choices.map((c,i) => <label className="prep-option" key={c.id}>
            <input type="radio" name={id} checked={item.selected===c.id} onChange={() => patch({selected:c.id,checked:true})}/><span>{i+1}.</span><code>{c.text}</code>
          </label>)}</fieldset>
          {item.selected!==undefined && <p role="status">{choiceCorrect ? '✓ 객관식 정답입니다. Ctrl + Enter로 주관식 문제로 이동하세요.' : '× 객관식 오답입니다. 1~4 키로 다시 고르거나 Ctrl + Enter로 주관식 문제로 이동하세요.'}</p>}
          <button className="primary-button" disabled={item.selected===undefined} onClick={() => enterWriting()}>주관식 문제로 이동 · Ctrl + Enter</button>
        </section>}
        {(exam || item.writing) && <section aria-label="주관식 단계">
          <h3>{exam ? '셀 안의 빈칸에 코드 작성' : '2. 아래 셀 안에서 직접 작성하기'}</h3>
          {!exam && <>
            <p role="status">{choiceCorrect ? '객관식 정답입니다.' : '객관식 오답입니다.'} 이제 같은 빈칸을 직접 작성해보세요.</p>
            <p>Ctrl + Enter로 채점하고, 정답이면 한 번 더 눌러 다음 문제로 이동합니다. Mac에서는 ⌘ + Enter도 가능합니다.</p>
            <button className="primary-button" disabled={!item.answer?.trim() || Boolean(item.graded && isCorrect(id,item.answer??'') && nextQuestionIndex(id)<0)} onClick={() => gradeOrAdvance(id,item.answer??'')}>
              {item.graded && isCorrect(id,item.answer??'') ? nextQuestionIndex(id)<0 ? '마지막 문제까지 풀었습니다' : '다음 문제 · Ctrl + Enter' : '주관식 채점 · Ctrl + Enter'}
            </button>
          </>}
          {reveal && <div className="prep-feedback" role="status"><strong>{isCorrect(id,item.answer??'') ? '✓ 정답' : item.answer?.trim() ? '× 오답' : '× 미입력'}</strong><h3>예시 답안</h3><pre>{q.answer}</pre><p>{q.explanation}</p></div>}
        </section>}
        <section aria-label="전체 실습 셀" className="prep-fullcell">
          <div className="prep-cell-heading">{q.source} · 전체 코드 (생략 없음) <button className="text-button" onClick={()=>{inputs.current[id]?.focus();inputs.current[id]?.scrollIntoView({block:'center'});}}>현재 빈칸으로 이동</button></div>
          <pre><code>{cellParts(collection.questionIds,id).map((part,i) => {
            const blank=part.question;
            if(!blank) return <span key={i}>{part.text}</span>;
            const progress=saved.items[blank.id] ?? {};
            const writable=exam ? !saved.submitted : Boolean(progress.writing);
            const value=progress.answer ?? '';
            return <span className="prep-inline-blank" key={blank.id}>
              <span className="prep-blank-label">[{collection.questionIds.indexOf(blank.id)+1}] {blank.topic}</span>
              <textarea ref={element=>{inputs.current[blank.id]=element;}} aria-label={`${blank.topic} · 코드 빈칸`} aria-current={blank.id===id ? 'step' : undefined}
                value={value} readOnly={!writable} placeholder={writable ? '코드 입력' : exam ? '미입력' : '선택 후 객관식 → 주관식'}
                rows={Math.max(1,value.split('\n').length)} spellCheck={false}
                onFocus={()=>{if(blank.id!==id)update({...saved,index:collection.questionIds.indexOf(blank.id)});}}
                onChange={event=>{if(writable)patch({answer:event.target.value,graded:false},blank.id);}}
                onKeyDown={event=>{
                  if(event.nativeEvent?.isComposing || event.repeat) return;
                  if(event.key==='Enter' && (event.ctrlKey || event.metaKey) && !exam){
                    event.preventDefault();event.stopPropagation();
                    if(!writable){
                      if(blank.id===id && item.selected!==undefined) enterWriting(id);
                      return;
                    }
                    const answer=event.currentTarget?.value ?? value;
                    gradeOrAdvance(blank.id,answer);
                    return;
                  }
                  if(event.key==='Tab'&&!event.shiftKey&&writable){event.preventDefault();const start=event.currentTarget.selectionStart,end=event.currentTarget.selectionEnd;patch({answer:value.slice(0,start)+'    '+value.slice(end),graded:false},blank.id);requestAnimationFrame(()=>inputs.current[blank.id]?.setSelectionRange(start+4,start+4));}
                }}/>
              {(exam ? saved.submitted : progress.graded) && <span className="prep-inline-result" role="status" aria-live="polite">{isCorrect(blank.id,value)?'✓ 정답':'× 오답'} · {blank.answer}</span>}
            </span>;
          })}</code></pre>
        </section>
        <div className="prep-actions">
          <button className="text-button" disabled={visibleIds.indexOf(id)<=0} onClick={() => go(collection.questionIds.indexOf(visibleIds[visibleIds.indexOf(id)-1]))}>← 이전</button>
          <span>{saved.index+1} / {collection.questionIds.length}</span>
          <button className="primary-button" disabled={visibleIds.indexOf(id)>=visibleIds.length-1} onClick={() => go(collection.questionIds.indexOf(visibleIds[visibleIds.indexOf(id)+1]))}>
            {!exam && item.graded && isCorrect(id,item.answer??'') ? '다음 → · Ctrl + Enter' : '다음 →'}
          </button>
        </div>
        {!exam && done===collection.questionIds.length && <p role="status">이 문제은행의 주관식 학습을 모두 마쳤습니다. 목록에서 모의고사로 실력을 확인하세요.</p>}
      </article>
    </div>
    {exam && !saved.submitted && <div className="prep-submit"><p>작성 {filled} · 미입력 {collection.questionIds.length-filled} · 제출 후 답안은 잠깁니다.</p><button className="primary-button" onClick={() => {update({...saved,submitted:true});window.scrollTo({top:0});}}>전체 답안 제출·채점</button></div>}
  </main>;
}
