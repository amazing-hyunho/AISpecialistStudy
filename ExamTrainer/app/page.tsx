'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import MockExam from './mock-exam';
import { drawExamCells } from './mock-selection';
import { normalized } from './grading';
import questionBankData from './question-bank.json';
import { questionExplanations, type QuestionExplanation } from './explanations';

type Chapter = {
  id: string;
  subject: string;
  number: string;
  title: string;
  file: string;
  questionCount: number;
};

type Cell = {
  sourceKind?: string;
  source: string;
  cell: number;
  answerSource: string;
};

type QuestionRecord = {
  id: string;
  subject: string;
  chapterId: string;
  chapterNumber: string;
  chapterTitle: string;
  file: string;
  topic: string;
  prompt: string;
  answer: string;
  occurrence: number;
  sourceId: string;
  isSourceBlank: boolean;
};

type Question = QuestionRecord & Cell & { explanation: QuestionExplanation };
type Screen = 'home' | 'chapters' | 'quiz' | 'wrong' | 'mock';
type ResultState = 'idle' | 'correct' | 'wrong';

const bank = questionBankData as {
  chapters: Chapter[];
  cells: Record<string, Cell>;
  questions: QuestionRecord[];
};

const bankQuestionIds = new Set(bank.questions.map((question) => question.id));
const unknownExplanationIds = Object.keys(questionExplanations)
  .filter((questionId) => !bankQuestionIds.has(questionId));

if (unknownExplanationIds.length) {
  throw new Error(
    `Question explanation mismatch. Unknown: ${unknownExplanationIds.join(', ')}`,
  );
}

const explanationFor = (question: QuestionRecord): QuestionExplanation =>
  questionExplanations[question.id] ?? {
    why: `이 문제는 강의자료에서 실제로 비워 둔 ${question.topic} 작성 구간입니다. ${question.prompt}`,
    memory: `강의 답안의 핵심 코드는 ${question.answer} 입니다.`,
  };

const questions: Question[] = bank.questions.map((question) => ({
  ...question,
  ...bank.cells[question.sourceId],
  explanation: explanationFor(question),
}));

function answerOffset(question: Question) {
  let offset = -1;
  let fromIndex = 0;
  for (let index = 0; index <= question.occurrence; index += 1) {
    offset = question.source.indexOf(question.answer, fromIndex);
    if (offset < 0) return Number.MAX_SAFE_INTEGER;
    fromIndex = offset + question.answer.length;
  }
  return offset;
}

function inNotebookOrder(left: Question, right: Question) {
  return left.cell - right.cell || answerOffset(left) - answerOffset(right);
}

const STORAGE_KEY = 'ai-exam-trainer-progress-v5';
const LEGACY_STORAGE_KEYS = [
  'ai-exam-trainer-progress-v4',
  'ai-exam-trainer-progress-v3',
  'ai-exam-trainer-progress-v2',
];
const REPLACED_QUESTION_IDS = new Set([
  'data-015',
  'data-016',
  'vision-016',
  'vision-018',
]);

const subjects = [
  {
    name: 'LLM',
    detail: `${bank.chapters.filter((chapter) => chapter.subject === 'LLM').length}개 노트북`,
    count: questions.filter((question) => question.subject === 'LLM').length,
    active: true,
  },
  {
    name: 'RAG',
    detail: `${bank.chapters.filter((chapter) => chapter.subject === 'RAG').length}개 노트북`,
    count: questions.filter((question) => question.subject === 'RAG').length,
    active: true,
  },
  {
    name: 'Data',
    detail: `${bank.chapters.filter((chapter) => chapter.subject === 'Data').length}개 노트북`,
    count: questions.filter((question) => question.subject === 'Data').length,
    active: true,
  },
  {
    name: 'Vision',
    detail: `${bank.chapters.filter((chapter) => chapter.subject === 'Vision').length}개 노트북`,
    count: questions.filter((question) => question.subject === 'Vision').length,
    active: true,
  },
  {
    name: 'On-device',
    detail: `${bank.chapters.filter((chapter) => chapter.subject === 'On-device').length}개 노트북`,
    count: questions.filter((question) => question.subject === 'On-device').length,
    active: true,
  },
];

export default function Home() {
  const answerRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedSubject, setSelectedSubject] = useState('LLM');
  const [chapterId, setChapterId] = useState(bank.chapters[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<ResultState>('idle');
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [examCells, setExamCells] = useState<string[]>([]);
  const [examRound, setExamRound] = useState(0);

  function startExam() {
    setExamCells(drawExamCells(questions.filter(q => q.sourceKind !== 'reconstructed')));
    setExamRound(round => round + 1);
    setScreen('mock');
  }

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const legacyEntry = stored
      ? null
      : LEGACY_STORAGE_KEYS
        .map((key) => ({ key, value: window.localStorage.getItem(key) }))
        .find((entry) => entry.value) ?? null;
    const progress = stored ?? legacyEntry?.value;
    queueMicrotask(() => {
      if (progress) {
        try {
          const parsed = JSON.parse(progress) as {
            wrongIds?: string[];
            solvedIds?: string[];
          };
          const keepCompatibleIds = (ids: string[] = []) => {
            if (!legacyEntry) return ids;
            if (legacyEntry.key === 'ai-exam-trainer-progress-v4') {
              return ids.filter((id) => !REPLACED_QUESTION_IDS.has(id));
            }
            return ids.filter((id) => id.startsWith('rag-'));
          };
          setWrongIds(keepCompatibleIds(parsed.wrongIds));
          setSolvedIds(keepCompatibleIds(parsed.solvedIds));
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ wrongIds, solvedIds }),
    );
  }, [wrongIds, solvedIds, hydrated]);

  const activeQuestions = useMemo(() => {
    if (screen === 'wrong') {
      return questions.filter((question) => wrongIds.includes(question.id));
    }
    return questions
      .filter((question) => question.chapterId === chapterId)
      .sort(inNotebookOrder);
  }, [chapterId, screen, wrongIds]);

  const current = activeQuestions[currentIndex] ?? questions[0];
  const answer = drafts[current.id] ?? '';
  const activeCellIds = [...new Set(activeQuestions.map((question) => question.sourceId))];
  const currentCellQuestions = activeQuestions.filter((question) => question.sourceId === current.sourceId);
  const currentCellPosition = Math.max(activeCellIds.indexOf(current.sourceId), 0) + 1;
  const currentBlankPosition = Math.max(
    currentCellQuestions.findIndex((question) => question.id === current.id),
    0,
  ) + 1;
  const completion = Math.round((solvedIds.length / questions.length) * 100);

  function resetQuestion() {
    setCurrentIndex(0);
    setResult('idle');
  }

  function openChapter(nextChapterId: string) {
    setChapterId(nextChapterId);
    setScreen('quiz');
    resetQuestion();
  }

  function openSubject(subject: string) {
    const firstChapter = bank.chapters.find((chapter) => chapter.subject === subject);
    if (!firstChapter) return;
    setSelectedSubject(subject);
    setChapterId(firstChapter.id);
    setScreen('chapters');
    resetQuestion();
  }

  function openWrongNotes() {
    setScreen('wrong');
    resetQuestion();
  }

  function grade() {
    if (!answer.trim()) return;
    const isCorrect = normalized(answer) === normalized(current.answer);
    setResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setSolvedIds((ids) =>
        ids.includes(current.id) ? ids : [...ids, current.id],
      );
    } else {
      setWrongIds((ids) =>
        ids.includes(current.id) ? ids : [...ids, current.id],
      );
    }
  }

  function nextQuestion() {
    selectQuestion((currentIndex + 1) % activeQuestions.length);
  }

  function selectQuestion(index: number, focus = true) {
    setCurrentIndex(index);
    setResult('idle');
    if (!focus) return;
    requestAnimationFrame(() => {
      const input = answerRefs.current[activeQuestions[index].id];
      input?.focus();
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function resolveWrong() {
    setWrongIds((ids) => ids.filter((id) => id !== current.id));
    setSolvedIds((ids) =>
      ids.includes(current.id) ? ids : [...ids, current.id],
    );
    nextQuestion();
  }

  if (screen === 'mock') return <MockExam key={examRound} cellIds={examCells} onHome={() => setScreen('home')} onRetry={startExam} onComplete={(correct, wrong) => {
    setSolvedIds(ids => [...new Set([...ids, ...correct])]);
    setWrongIds(ids => [...new Set([...ids, ...wrong])]);
  }} />;

  if (screen === 'chapters') {
    const subjectChapters = bank.chapters.filter((chapter) => chapter.subject === selectedSubject);
    const subjectQuestions = questions.filter((question) => question.subject === selectedSubject);
    return (
      <main className="app-shell">
        <Header onHome={() => setScreen('home')} onWrong={openWrongNotes} wrongCount={wrongIds.length} />
        <section className="chapter-page">
          <div className="chapter-page-heading">
            <span className="eyebrow">{selectedSubject} · {subjectChapters.length} Notebooks</span>
            <h1>학습할 챕터를 선택하세요.</h1>
            <p>강의 노트북의 코드 셀을 기준으로 만든 {subjectQuestions.length}개 문제입니다.</p>
          </div>
          <div className="chapter-grid">
            {subjectChapters.map((chapter) => {
              const chapterQuestions = questions.filter((q) => q.chapterId === chapter.id);
              const solved = chapterQuestions.filter((q) => solvedIds.includes(q.id)).length;
              const wrong = chapterQuestions.filter((q) => wrongIds.includes(q.id)).length;
              const percent = Math.round((solved / chapter.questionCount) * 100);

              return (
                <button key={chapter.id} className="chapter-card" onClick={() => openChapter(chapter.id)}>
                  <div className="chapter-card-top">
                    <span>CH. {chapter.number}</span>
                    <strong>{chapter.questionCount}문제</strong>
                  </div>
                  <h2>{chapter.title}</h2>
                  <p>{chapter.file}</p>
                  <div className="chapter-card-footer">
                    <div className="progress-track small-card"><span style={{ width: `${percent}%` }} /></div>
                    <span>{solved} 완료 · {wrong} 오답</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  if (screen === 'quiz' || screen === 'wrong') {
    if (screen === 'wrong' && activeQuestions.length === 0) {
      return (
        <main className="empty-state">
          <div className="empty-card">
            <span className="eyebrow">오답노트</span>
            <h1>남은 오답이 없습니다</h1>
            <p>틀린 문제는 이곳에 모이고, 일반 학습에도 계속 등장합니다.</p>
            <button className="primary-button" onClick={() => setScreen('home')}>학습 홈으로</button>
          </div>
        </main>
      );
    }

    return (
      <main className="app-shell quiz-shell" onKeyDown={event => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          if (result === 'correct') nextQuestion();
          else grade();
        }
      }}>
        <Header onHome={() => setScreen('home')} compact />
        <section className="quiz-layout">
          <aside className="question-rail">
            <span className="eyebrow">{current.subject} · Chapter {current.chapterNumber}</span>
            <h2>{screen === 'wrong' ? '오답 복습' : current.chapterTitle}</h2>
            <p>전체 코드 셀 안에서 공개 제한 부분을 직접 채우세요. 여러 줄 답안도 입력할 수 있습니다.</p>
            <div className="source-meta">
              <span>출제 노트북</span>
              <strong>{current.file}</strong>
              <span>{current.sourceKind === 'reconstructed' ? '재구성 예제 · 원본 한 셀이 아닙니다' : `Notebook Cell ${current.cell}`}</span>
              <strong>현재 셀 {currentCellPosition} / {activeCellIds.length}</strong>
            </div>
            <button className="text-button" onClick={() => setScreen(screen === 'wrong' ? 'home' : 'chapters')}>
              ← {screen === 'wrong' ? '학습 홈' : '챕터 선택'}
            </button>
          </aside>

          <article className="question-panel">
            <div className="question-heading">
              <div>
                <span className="topic-pill">
                  {current.isSourceBlank ? '★ ' : ''}{current.topic}
                </span>
                <h1>{current.prompt}</h1>
              </div>
              <span className="question-number cell-number">Cell {current.cell}</span>
            </div>

            <div className="question-progress-row">
              <span>Cell {current.cell} · 빈칸 {currentBlankPosition}/{currentCellQuestions.length}</span>
              <div className="progress-track question-track">
                <span style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }} />
              </div>
              <span>전체 {currentIndex + 1}/{activeQuestions.length}</span>
            </div>

            <nav className="blank-picker" aria-label="챕터 전체 빈칸">
              {activeQuestions.map((q, i) => <button key={q.id} aria-current={q.id === current.id ? 'step' : undefined} onClick={() => selectQuestion(i)}>
                {solvedIds.includes(q.id) ? '✓ ' : ''}{i + 1}. Cell {q.cell} · {q.topic}
              </button>)}
            </nav>
            {activeCellIds.map(sourceId => {
              const cellQuestions = activeQuestions.filter(q => q.sourceId === sourceId).sort((a, b) => answerOffset(a) - answerOffset(b));
              const source = bank.cells[sourceId].source;
              const pieces = [];
              let cursor = 0;
              for (const q of cellQuestions) {
                const start = answerOffset(q);
                if (start < cursor || start >= source.length) continue;
                pieces.push(<span key={`${q.id}-text`}>{source.slice(cursor, start)}</span>);
                const value = drafts[q.id] ?? '';
                pieces.push(<span className="inline-answer-group" key={q.id}><textarea
                  key={q.id}
                  ref={element => { answerRefs.current[q.id] = element; }}
                  className="inline-code-input"
                  aria-label={`Cell ${q.cell} · ${q.topic} · 빈칸 ${activeQuestions.findIndex(item => item.id === q.id) + 1}`}
                  aria-current={q.id === current.id ? 'step' : undefined}
                  aria-describedby={q.id === current.id && result !== 'idle' ? `feedback-${q.id}` : undefined}
                  placeholder="### 공개 제한 ###"
                  value={value}
                  rows={Math.max(1, value.split('\n').length)}
                  style={{ width: `${Math.min(90, Math.max(23, ...value.split('\n').map(line => line.length + 2)))}ch` }}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  onFocus={() => { if (q.id !== current.id) selectQuestion(activeQuestions.findIndex(item => item.id === q.id), false); }}
                  onChange={event => {
                    setDrafts(previous => ({ ...previous, [q.id]: event.target.value }));
                    setResult('idle');
                  }}
                  onKeyDown={event => {
                    if (event.key !== 'Tab' || event.shiftKey) return;
                    event.preventDefault();
                    const input = event.currentTarget;
                    const start = input.selectionStart;
                    const end = input.selectionEnd;
                    setDrafts(previous => ({ ...previous, [q.id]: value.slice(0, start) + '    ' + value.slice(end) }));
                    setResult('idle');
                    requestAnimationFrame(() => input.setSelectionRange(start + 4, start + 4));
                  }}
                />
                  {q.id === current.id && result !== 'idle' && <span
                    id={`feedback-${q.id}`}
                    className={`result-card inline-feedback ${result}`}
                    role="status"
                    aria-live="polite"
                  >
                    <strong>{result === 'correct' ? '✓ 정답입니다!' : '오답 · 오답노트에 저장했어요'}</strong>
                    <span className="feedback-label">정답 코드</span>
                    <span className="answer-code">{q.answer}</span>
                    <span className="feedback-label">코드 해설</span>
                    <span>{q.explanation.why}</span>
                    <span className="feedback-label">암기 포인트</span>
                    <span>{q.explanation.memory}</span>
                    <span className="feedback-hint">{result === 'correct' ? 'Ctrl + Enter → 다음 빈칸' : '수정 후 Ctrl + Enter → 다시 채점'}</span>
                    {screen === 'wrong' && result === 'correct' && <button className="resolve-button" onClick={resolveWrong}>오답 해결</button>}
                  </span>}
                </span>);
                cursor = start + q.answer.length;
              }
              pieces.push(<span key="tail">{source.slice(cursor)}</span>);
              return <section className="code-window chapter-code" key={sourceId} aria-label={`코드 셀 ${bank.cells[sourceId].cell}`}>
                <div className="code-cell-title">{bank.cells[sourceId].sourceKind === 'reconstructed' ? '재구성 예제 · 실습 힌트를 바탕으로 여러 구간을 합친 코드 (모의고사 제외)' : `Cell ${bank.cells[sourceId].cell}`} · 빈칸 {cellQuestions.length}개</div>
                <pre><code>{pieces}</code></pre>
              </section>;
            })}

            <div className="quiz-actions">
              <span aria-live="polite">Cell {current.cell} · {current.topic}<br />{result === 'correct' ? '✓ 정답! Ctrl + Enter로 다음 빈칸' : result === 'wrong' ? '오답노트에 저장했어요. 수정 후 Ctrl + Enter로 재채점' : 'Ctrl + Enter로 채점 · 공백·들여쓰기 무시'}<br />Tab: 들여쓰기 · Shift + Tab: 입력칸 밖으로 이동</span>
              {result === 'idle' ? (
                <button className="primary-button" onClick={grade} disabled={!answer.trim()}>정답 확인</button>
              ) : (
                <button className="primary-button" onClick={nextQuestion}>다음 문제 →</button>
              )}
            </div>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Header onHome={() => setScreen('home')} onWrong={openWrongNotes} wrongCount={wrongIds.length} />
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">AI 인증시험 · 코드 암기</span>
          <h1>강의자료 그대로,<br />한 칸씩 기억하기.</h1>
          <p>LLM·RAG·Data·Vision·On-device 강의 노트북 {bank.chapters.length}개의 핵심 코드를 빈칸으로 만들었습니다. 답안 코드와 비교하고, 틀린 코드는 다시 만납니다.</p>
          <div className="hero-actions">
            <button className="primary-button large mock-start" onClick={startExam}>랜덤 모의고사 · 10셀 →</button>
            <Link className="primary-button large" href="/handbook/">읽는 암기 핸드북 →</Link>
            <button className="primary-button large" onClick={() => openSubject('On-device')}>
              On-device 챕터 선택 <span>→</span>
            </button>
            <span className="hero-caption">{bank.chapters.length}개 노트북 · {questions.length}문제</span>
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-card-top"><span>나의 암기 현황</span><strong>{completion}%</strong></div>
          <div className="progress-track"><span style={{ width: `${completion}%` }} /></div>
          <div className="stat-grid">
            <div><strong>{questions.length}</strong><span>전체 문제</span></div>
            <div><strong>{solvedIds.length}</strong><span>학습 완료</span></div>
            <div><strong>{wrongIds.length}</strong><span>남은 오답</span></div>
          </div>
          <div className="today-note">
            <span className="today-dot" />
            <p><strong>오늘의 목표</strong>한 챕터를 골라 끝까지 복습하세요.</p>
          </div>
        </div>
      </section>

      <section className="subject-section">
        <div className="section-heading">
          <div><span className="eyebrow">Study Map</span><h2>과목별 문제은행</h2></div>
          <p>출제포인트에 맞춰 과목별로 확장합니다.</p>
        </div>
        <div className="subject-grid">
          {subjects.map((subject, index) => (
            <button
              key={subject.name}
              className={`subject-card ${subject.active ? 'active' : ''}`}
              onClick={() => subject.active && openSubject(subject.name)}
              disabled={!subject.active}
            >
              <span className="subject-index">0{index + 1}</span>
              <div><h3>{subject.name}</h3><p>{subject.detail}</p></div>
              <span className="subject-count">{subject.active ? `${subject.count}문제` : '다음 단계'}</span>
            </button>
          ))}
        </div>
      </section>

      <footer><span>★ 원본 빈칸</span><p>별표는 강의 실습본에서 실제로 비어 있던 코드입니다.</p></footer>
    </main>
  );
}

function Header({
  onHome,
  onWrong,
  wrongCount = 0,
  compact = false,
}: {
  onHome: () => void;
  onWrong?: () => void;
  wrongCount?: number;
  compact?: boolean;
}) {
  return (
    <header className="topbar">
      <button className="brand-button" onClick={onHome}>
        <span className="brand-mark">A</span><span>AI Coding Recall</span>
      </button>
      {!compact && onWrong && (
        <button className="wrong-note-button" onClick={onWrong}>
          <span>오답노트</span><strong>{wrongCount}</strong>
        </button>
      )}
    </header>
  );
}
