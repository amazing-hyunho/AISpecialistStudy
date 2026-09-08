'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
type Screen = 'home' | 'chapters' | 'quiz' | 'wrong';
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

function normalized(value: string) {
  return value.replace(/\r\n/g, '\n').trim();
}

function maskedSource(question: Question) {
  let index = -1;
  let fromIndex = 0;
  for (let count = 0; count <= question.occurrence; count += 1) {
    index = question.source.indexOf(question.answer, fromIndex);
    if (index === -1) break;
    fromIndex = index + question.answer.length;
  }
  if (index === -1) return question.source;
  const marker = `▰ 빈칸 ${'━'.repeat(
    Math.min(24, Math.max(8, question.answer.length)),
  )}▰`;
  return `${question.source.slice(0, index)}${marker}${question.source.slice(
    index + question.answer.length,
  )}`;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedSubject, setSelectedSubject] = useState('LLM');
  const [chapterId, setChapterId] = useState(bank.chapters[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ResultState>('idle');
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

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
    setAnswer('');
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
    setCurrentIndex((index) =>
      index + 1 >= activeQuestions.length ? 0 : index + 1,
    );
    setAnswer('');
    setResult('idle');
  }

  function resolveWrong() {
    setWrongIds((ids) => ids.filter((id) => id !== current.id));
    setSolvedIds((ids) =>
      ids.includes(current.id) ? ids : [...ids, current.id],
    );
    nextQuestion();
  }

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
      <main className="app-shell quiz-shell">
        <Header onHome={() => setScreen('home')} compact />
        <section className="quiz-layout">
          <aside className="question-rail">
            <span className="eyebrow">{current.subject} · Chapter {current.chapterNumber}</span>
            <h2>{screen === 'wrong' ? '오답 복습' : current.chapterTitle}</h2>
            <p>강의자료의 원문 코드에서 중요한 한 부분을 가렸습니다.</p>
            <div className="source-meta">
              <span>출제 노트북</span>
              <strong>{current.file}</strong>
              <span>Notebook Cell {current.cell}</span>
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

            <div className="code-window">
              <div className="code-toolbar">
                <span className="code-dot coral" />
                <span className="code-dot amber" />
                <span className="code-dot mint" />
                <span className="code-label">Python · Code Cell</span>
              </div>
              <pre><code>{maskedSource(current)}</code></pre>
            </div>

            <label className="answer-label" htmlFor="answer">빈칸에 들어갈 코드를 입력하세요</label>
            <textarea
              id="answer"
              className="answer-input"
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value);
                if (result !== 'idle') setResult('idle');
              }}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') grade();
              }}
              placeholder="답안지의 코드를 떠올려 입력"
              spellCheck={false}
              autoFocus
            />

            {result !== 'idle' && (
              <section className={`result-card ${result}`} aria-live="polite">
                <div className="result-content">
                  <span className="result-kicker">
                    {result === 'correct' ? '정답입니다' : '오답노트에 저장했습니다'}
                  </span>
                  <p className="answer-code">{current.answer}</p>
                  {result === 'wrong' && <p className="result-note">답안지의 정확한 코드를 확인하고 다시 외워보세요.</p>}
                  <div className="explanation-copy">
                    <span>코드 해설</span>
                    <p>{current.explanation.why}</p>
                    <div className="memory-tip">
                      <strong>암기 포인트</strong>
                      <p>{current.explanation.memory}</p>
                    </div>
                  </div>
                </div>
                {screen === 'wrong' && result === 'correct' && (
                  <button className="resolve-button" onClick={resolveWrong}>오답 해결</button>
                )}
              </section>
            )}

            <div className="quiz-actions">
              <span>Ctrl + Enter로 채점</span>
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
