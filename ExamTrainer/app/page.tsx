'use client';

import { useEffect, useMemo, useState } from 'react';

type Question = {
  id: string;
  topic: string;
  prompt: string;
  source: string;
  answer: string;
  cell: number;
};

type ResultState = 'idle' | 'correct' | 'wrong';

const INSTALL_CELL = `%pip install gensim`;

const VECTOR_SPACE_CELL = `import gensim.downloader as api

def run_gensim_tutorial():
    # 1. 사전 학습된 가벼운 모델 다운로드 및 로드 (약 65MB)
    # 강의 중 첫 실행 시 다운로드 시간이 약간 소요될 수 있습니다.
    print("모델을 로딩 중입니다... (glove-wiki-gigaword-50)\\n")
    model = api.load("glove-wiki-gigaword-50")

    # ----------------------------------------------------
    # [기능 1] 단어의 의미(유사도) 계산하기
    # 두 단어 벡터 간의 코사인 유사도(Cosine Similarity)를 계산합니다.
    # ----------------------------------------------------
    print("1. 단어 간 유사도 계산하기")
    word1, word2, word3 = 'cat', 'dog', 'car'

    sim_cat_dog = model.similarity(word1, word2)
    sim_cat_car = model.similarity(word1, word3)

    print(f" - '{word1}'와 '{word2}'의 유사도: {sim_cat_dog:.4f}")
    print(f" - '{word1}'와 '{word3}'의 유사도: {sim_cat_car:.4f}\\n")

    # ----------------------------------------------------
    # [기능 2] 유사한 단어 가져오기
    # 특정 단어와 벡터 공간상에서 가장 가까운 단어들을 추출합니다.
    # ----------------------------------------------------
    print("2. 'computer'와 가장 유사한 단어 5개 가져오기")
    target_word = 'computer'
    similar_words = model.most_similar(target_word, topn=5)

    for word, score in similar_words:
        print(f" - {word} (유사도 점수: {score:.4f})")
    print()

    # ----------------------------------------------------
    # [기능 3] 주어진 단어들을 그룹으로 분류 (이질적인 단어 찾기)
    # 단어들의 의미적 군집을 파악하여, 그룹에 어울리지 않는 단어를 찾아냅니다.
    # ----------------------------------------------------
    print("3. 단어 그룹 중 성격이 다른 단어(Outlier) 분류하기")
    word_group = ['apple', 'banana', 'orange', 'car']

    outlier = model.doesnt_match(word_group)
    print(f" - 단어 그룹: {word_group}")
    print(f" - 과일 그룹에 어울리지 않는 단어: '{outlier}'\\n")

# 실행
if __name__ == "__main__":
    run_gensim_tutorial()`;

const questions: Question[] = [
  {
    id: 'llm-vector-01',
    topic: '환경 준비',
    prompt: 'Gensim 라이브러리를 설치하는 코드를 완성하세요.',
    source: INSTALL_CELL,
    answer: '%pip install gensim',
    cell: 1,
  },
  {
    id: 'llm-vector-02',
    topic: '모델 불러오기',
    prompt: '사전 학습 모델을 내려받기 위해 사용하는 모듈을 완성하세요.',
    source: VECTOR_SPACE_CELL,
    answer: 'gensim.downloader as api',
    cell: 2,
  },
  {
    id: 'llm-vector-03',
    topic: '모델 불러오기',
    prompt: 'GloVe 사전 학습 모델을 불러오는 부분을 완성하세요.',
    source: VECTOR_SPACE_CELL,
    answer: 'api.load("glove-wiki-gigaword-50")',
    cell: 2,
  },
  {
    id: 'llm-vector-04',
    topic: '코사인 유사도',
    prompt: 'cat과 dog의 벡터 유사도를 계산하는 부분을 완성하세요.',
    source: VECTOR_SPACE_CELL,
    answer: 'model.similarity(word1, word2)',
    cell: 2,
  },
  {
    id: 'llm-vector-05',
    topic: '코사인 유사도',
    prompt: 'cat과 car의 벡터 유사도를 계산하는 부분을 완성하세요.',
    source: VECTOR_SPACE_CELL,
    answer: 'model.similarity(word1, word3)',
    cell: 2,
  },
  {
    id: 'llm-vector-06',
    topic: '유사 단어 검색',
    prompt: '가장 유사한 단어 5개를 가져오는 부분을 완성하세요.',
    source: VECTOR_SPACE_CELL,
    answer: 'model.most_similar(target_word, topn=5)',
    cell: 2,
  },
  {
    id: 'llm-vector-07',
    topic: '결과 순회',
    prompt: '유사 단어와 점수를 하나씩 꺼내는 반복문을 완성하세요.',
    source: VECTOR_SPACE_CELL,
    answer: 'for word, score in similar_words:',
    cell: 2,
  },
  {
    id: 'llm-vector-08',
    topic: '이상 단어 찾기',
    prompt: '그룹에 어울리지 않는 단어를 찾는 부분을 완성하세요.',
    source: VECTOR_SPACE_CELL,
    answer: 'model.doesnt_match(word_group)',
    cell: 2,
  },
];

const subjects = [
  { name: 'LLM', detail: 'Vector Space', count: questions.length, active: true },
  { name: 'RAG', detail: '준비 중', count: 0, active: false },
  { name: 'Data', detail: 'TIME', count: 0, active: false },
  { name: 'Vision', detail: '준비 중', count: 0, active: false },
  { name: 'On-device', detail: '준비 중', count: 0, active: false },
];

const STORAGE_KEY = 'ai-exam-trainer-progress-v1';

function normalized(value: string) {
  return value.replace(/\r\n/g, '\n').trimEnd();
}

function maskedSource(question: Question) {
  const index = question.source.indexOf(question.answer);
  if (index === -1) return question.source;
  return `${question.source.slice(0, index)}▰ 빈칸 ${'━'.repeat(
    Math.min(24, Math.max(8, question.answer.length)),
  )}▰${question.source.slice(index + question.answer.length)}`;
}

export default function Home() {
  const [screen, setScreen] = useState<'home' | 'quiz' | 'wrong'>('home');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ResultState>('idle');
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    queueMicrotask(() => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as {
            wrongIds?: string[];
            solvedIds?: string[];
          };
          setWrongIds(parsed.wrongIds ?? []);
          setSolvedIds(parsed.solvedIds ?? []);
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
    if (screen !== 'wrong') return questions;
    return questions.filter((question) => wrongIds.includes(question.id));
  }, [screen, wrongIds]);

  const current = activeQuestions[currentIndex] ?? questions[0];
  const completion = Math.round((solvedIds.length / questions.length) * 100);

  function openSession(mode: 'quiz' | 'wrong') {
    setScreen(mode);
    setCurrentIndex(0);
    setAnswer('');
    setResult('idle');
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
    const next = currentIndex + 1;
    setCurrentIndex(next >= activeQuestions.length ? 0 : next);
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

  if (screen !== 'home') {
    if (screen === 'wrong' && activeQuestions.length === 0) {
      return (
        <main className="empty-state">
          <div className="empty-card">
            <span className="eyebrow">오답노트</span>
            <h1>남은 오답이 없습니다</h1>
            <p>틀린 문제는 여기에 모이고, 일반 학습에도 계속 등장합니다.</p>
            <button className="primary-button" onClick={() => setScreen('home')}>
              학습 홈으로
            </button>
          </div>
        </main>
      );
    }

    return (
      <main className="app-shell quiz-shell">
        <header className="topbar">
          <button className="brand-button" onClick={() => setScreen('home')}>
            <span className="brand-mark">A</span>
            <span>AI Coding Recall</span>
          </button>
          <div className="session-progress" aria-label="현재 문제 진행률">
            <span>
              {screen === 'wrong' ? '오답 복습' : 'LLM 학습'} · {currentIndex + 1}/
              {activeQuestions.length}
            </span>
            <div className="progress-track small">
              <span
                style={{
                  width: `${((currentIndex + 1) / activeQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </header>

        <section className="quiz-layout">
          <aside className="question-rail">
            <span className="eyebrow">Chapter 01</span>
            <h2>Vector Space</h2>
            <p>강의자료의 원문 코드에서 중요한 한 부분을 가렸습니다.</p>
            <div className="source-meta">
              <span>원본 파일</span>
              <strong>Chapter_1_Exercise_Vector Space.ipynb</strong>
              <span>코드 셀 {current.cell}</span>
            </div>
            <button className="text-button" onClick={() => setScreen('home')}>
              ← 학습 종료
            </button>
          </aside>

          <article className="question-panel">
            <div className="question-heading">
              <div>
                <span className="topic-pill">{current.topic}</span>
                <h1>{current.prompt}</h1>
              </div>
              <span className="question-number">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
            </div>

            <div className="code-window">
              <div className="code-toolbar">
                <span className="code-dot coral" />
                <span className="code-dot amber" />
                <span className="code-dot mint" />
                <span className="code-label">Python · Code Cell {current.cell}</span>
              </div>
              <pre><code>{maskedSource(current)}</code></pre>
            </div>

            <label className="answer-label" htmlFor="answer">
              빈칸에 들어갈 코드를 입력하세요
            </label>
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
              placeholder="정답 코드를 그대로 입력"
              spellCheck={false}
              autoFocus
            />

            {result !== 'idle' && (
              <section className={`result-card ${result}`} aria-live="polite">
                <div>
                  <span className="result-kicker">
                    {result === 'correct' ? '정답입니다' : '오답노트에 저장했습니다'}
                  </span>
                  <p className="answer-code">{current.answer}</p>
                  {result === 'wrong' && (
                    <p className="result-note">답안지의 정확한 코드를 확인하고 다시 외워보세요.</p>
                  )}
                </div>
                {screen === 'wrong' && result === 'correct' && (
                  <button className="resolve-button" onClick={resolveWrong}>
                    오답 해결
                  </button>
                )}
              </section>
            )}

            <div className="quiz-actions">
              <span>Ctrl + Enter로 채점</span>
              {result === 'idle' ? (
                <button
                  className="primary-button"
                  onClick={grade}
                  disabled={!answer.trim()}
                >
                  정답 확인
                </button>
              ) : (
                <button className="primary-button" onClick={nextQuestion}>
                  다음 문제 →
                </button>
              )}
            </div>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar home-topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>AI Coding Recall</span>
        </div>
        <button className="wrong-note-button" onClick={() => openSession('wrong')}>
          <span>오답노트</span>
          <strong>{wrongIds.length}</strong>
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">AI 인증시험 · 코드 암기</span>
          <h1>강의자료 그대로,<br />한 칸씩 기억하기.</h1>
          <p>
            Jupyter Notebook의 실제 코드 셀에서 핵심 구문을 가렸습니다.
            답안지와 비교하고, 틀린 코드는 다시 만납니다.
          </p>
          <div className="hero-actions">
            <button className="primary-button large" onClick={() => openSession('quiz')}>
              LLM 학습 시작 <span>→</span>
            </button>
            <span className="hero-caption">Chapter 1 · 8문제</span>
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-card-top">
            <span>나의 암기 현황</span>
            <strong>{completion}%</strong>
          </div>
          <div className="progress-track"><span style={{ width: `${completion}%` }} /></div>
          <div className="stat-grid">
            <div><strong>{questions.length}</strong><span>전체 문제</span></div>
            <div><strong>{solvedIds.length}</strong><span>학습 완료</span></div>
            <div><strong>{wrongIds.length}</strong><span>남은 오답</span></div>
          </div>
          <div className="today-note">
            <span className="today-dot" />
            <p><strong>오늘의 목표</strong>Vector Space 코드를 끝까지 복습하세요.</p>
          </div>
        </div>
      </section>

      <section className="subject-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Study Map</span>
            <h2>과목별 문제은행</h2>
          </div>
          <p>현재 자료 41개 노트북을 과목별로 확장합니다.</p>
        </div>

        <div className="subject-grid">
          {subjects.map((subject, index) => (
            <button
              key={subject.name}
              className={`subject-card ${subject.active ? 'active' : ''}`}
              onClick={() => subject.active && openSession('quiz')}
              disabled={!subject.active}
            >
              <span className="subject-index">0{index + 1}</span>
              <div><h3>{subject.name}</h3><p>{subject.detail}</p></div>
              <span className="subject-count">
                {subject.active ? `${subject.count}문제` : '다음 단계'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <footer>
        <span>Source locked</span>
        <p>강의자료와 답안지의 코드만 사용합니다.</p>
      </footer>
    </main>
  );
}
