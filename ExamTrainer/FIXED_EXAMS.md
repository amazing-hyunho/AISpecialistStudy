# 월별 복기·예상 주제 문제은행과 모의고사

2026-10-26 개편. 기존 고정 10회와 랜덤 10셀 모의고사를 삭제했다.
현재 진입점은 `/exam-prep/`, 구성 원본은 `app/exam-prep/data.ts`이다.
기존 강의 문제은행과 사용자 학습 기록은 유지한다.

## 문제은행

- 월별 5개: 4월 1차 53문항, 4월 2차 59문항, 5월 37문항, 6월 46문항, 9월 40문항.
- 예상 주제 24개: LLM 6개, RAG 3개, Data 6개, Vision 5개, On-device 4개.
- 중복 제외 162문항. 모든 정답은 Study 노트북 원문에서 확인한 코드다. 신규 구현 예제는 사용하지 않는다.
- 각 문항은 객관식 선택·확인 → 보기 접기 → 같은 빈칸 주관식 작성·채점 순서다.
- 회차·주제 사이에 같은 문항이 재사용되며 학습 진행은 각 세트별로 저장한다.

## 모의고사

- 월별 복기 5회: 각 월별 문제은행의 모든 문항을 주관식으로 출제한다. 실제 시험 문항 수의 복원이 아니다.
- 예상 3회: 매회 25문항, 다섯 과목 각 5문항. 총 75문항은 회차 간 중복이 없고 24개 대비 주제를 모두 포함한다.
- 1회: MHA·GPT, 검색·KG, window·Conv1D·학습·RNN, ResNet·전처리·평가·학습, kernel·channel·양자화·증류.
- 2회: DPO 데이터·모델·LoRA 설정·분류, KG·MCP, NGCF·NCF, DETR 추론·ViT Attention·residual, pruning·양자화·증류.
- 3회: 생성·학습·DPO 데이터·LoRA, 검색·prompt·MCP, window·Conv1D·Seq2Seq·추천, 분류·Attention·학습, pruning·재양자화·증류.
- 제출 전 정답·해설 비공개, 제출 후 답안 잠금·전체 및 과목별 점수·오답 필터·재응시 제공.
- 모든 문항은 같은 배점. 미입력도 오답이다.

## 근거와 제한

월별 범위는 사용자 복기에 근거한다. 9월 원문은 `app/exam-recall/original.ts`를 보존한다.
반복 또는 9월 상세 구현을 우선, 한 회차에만 명시된 주제를 보완으로 분류한다. 통계적 출제 확률이 아니다.
4월 1차 시계열, 5월 RAG·COCO, 6월 GPT·ResNet처럼 세부 구현이 없는 주제는 대응 연습임을 표시한다.

### 출제포인트 PDF 반영

기준: `Study/AI인증시험_출제포인트.pdf` 1쪽 (문서 하단에 ‘26.3월 시험 기준으로 명시).
월별 복기 범위는 그대로 유지하고 PDF의 추가 요구는 예상 주제·예상 모의고사에 반영한다.

| PDF 출제포인트 | 학습자료 기반 대응 |
| --- | --- |
| LLM 레이어·Tensor 흐름·학습·데이터 구성 | MHA·GPT·직접 구현 LoRA·DPO 데이터/모델 준비·분류·언어 모델 손실/역전파 |
| RAG 구성·흐름·llama-index·MCP | 기본 검색·프롬프트·KG·MCP 연결과 Agent |
| Data 모델·Tensor·학습·데이터·library·Metric | window·Conv1D·RNN·NGCF·NCF·손실/역전파·sklearn 분할·RMSE/MAPE |
| Vision 레이어·학습·데이터·transforms·Metric | ResNet·ViT Attention/residual·DETR 추론·CIFAR transforms·분류 손실/갱신·정확도 |
| On-device Quantization·Pruning·Distillation | scale/zero point/재양자화·kernel/channel·Teacher/Student 학습 |

### 자료에 없는 복기 항목의 교체

- PEFT LoraConfig → 강의 LoRA의 rank/alpha 선언, A/B 행렬·보정 경로·가중치 동결.
- DETR 내부 MHA·EncoderLayer → `02_ViT_CIFAR10.ipynb` 셀 8의 QKV·점수·Value 가중합·Attention/FFN residual. DETR 구현이라고 표시하지 않는다.
- 별도 DPO 딕셔너리 예제 → DPO 실습 셀 0에 실제로 있는 `prompt = format_input(entry)`, `entry["chosen"]`, `entry["rejected"]`.
- 원문이 미완성인 DPO 손실·로그확률 재구성 문제는 이번 월별·예상 세트에서 제외한다. 기존 과목별 자료는 보존한다.

`material-questions.json`은 DPO 원문 3개 발췌와 ViT Value 가중합 1문항을 담는다. 모두 원본 파일·셀과 정확히 일치하는지 테스트한다.
보충 예제 6개와 외부 구현 참고 링크는 삭제했다. 예상 주제에는 PDF 기준의 LLM 학습, Data 학습·평가, Vision 학습·평가, 지식증류를 추가했다.
PDF의 원리 이해 범위를 코드 연습에 대응시킨 것이며, 원리 설명 능력 전체를 이 빈칸 채점만으로 보증하지 않는다.

채점은 공백·들여쓰기를 제외한 예시 답안 토큰 비교다. Python 실행이나 동등 구현 판정이 아니다.
상태는 브라우저 localStorage의 `ai-monthly-prep-v2:` 별도 공간에 저장한다. 구성이 변경된 세트는 새 버전에서 시작하며 기존 v1 기록 키는 삭제하지 않는다.

## 검증

- `node scripts/test-exam-prep.cjs`: 회차·주제 매핑, 원문 발췌 일치·재구성/보충 제외, 출처·보기, 과목 균형, 전체 주제 포함, 학습 단계, 저장·복원, 일괄 채점·잠금·재응시.
- `node scripts/test-inline-quiz.cjs`: 기존 강의 학습 회귀.
- `node scripts/audit-bank.cjs`: 기존 282문제 출처·정답 위치 검증.
- `npm run lint`, `npm run build`.
- 로컬 브라우저에서 객관식→주관식→채점 흐름 확인.
