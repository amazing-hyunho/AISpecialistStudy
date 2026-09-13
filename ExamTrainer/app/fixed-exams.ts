import bank from './question-bank.json';

// Each anchor selects its entire original cell, including every registered blank.
// Deliberate repetition across rounds supports memorization; never randomize these sets.
const plans = [
  { title: '기본 흐름 고정', focus: '입력 데이터부터 검색·학습으로 이어지는 기본 흐름. 양자화와 가지치기의 첫 계산을 익힙니다.',
    anchors: ['llm-002', 'llm-005', 'rag-004', 'rag-006', 'data-001', 'data-007', 'vision-001', 'vision-025', 'ondevice-004', 'ondevice-001'] },
  { title: '주요 레이어와 표현', focus: 'Attention·RNN·ViT의 텐서 흐름, 문서 분할, 양자화 표현과 지식증류를 연결합니다.',
    anchors: ['llm-033', 'llm-042', 'rag-020', 'rag-004', 'data-009', 'data-017', 'vision-004', 'vision-006', 'ondevice-005', 'ondevice-008'] },
  { title: '예측과 정답을 학습으로', focus: '손실·역전파·평가의 차이를 집중 복습합니다. 검색한 근거가 응답 생성까지 전달되는지 확인합니다.',
    anchors: ['llm-007', 'llm-008', 'rag-006', 'rag-025', 'data-001', 'data-018', 'vision-025', 'vision-029', 'ondevice-008', 'ondevice-007'] },
  { title: '데이터 구성과 평가', focus: '패딩·시프트·정규화·데이터 분할과 이미지 변환을 복습하고, 정확도 집계와 프루닝 기준을 익힙니다.',
    anchors: ['llm-067', 'llm-078', 'rag-019', 'rag-020', 'data-015', 'data-016', 'vision-001', 'vision-033', 'ondevice-001', 'ondevice-021'] },
  { title: '미세조정과 검색 활용', focus: '모델·토크나이저 로드와 LoRA 경로를 복습합니다. 그래프 추천과 KG 질의의 서로 다른 역할도 구분합니다.',
    anchors: ['llm-019', 'llm-009', 'rag-010', 'rag-011', 'data-010', 'data-013', 'vision-002', 'vision-016', 'ondevice-013', 'ondevice-017'] },
  { title: '문맥 선택과 표현 전달', focus: 'LoRA 보정과 패딩 손실 제외, KG·검색 분기, encoder-decoder 및 특징 기반 증류를 다룹니다.',
    anchors: ['llm-076', 'llm-082', 'rag-012', 'rag-006', 'data-026', 'data-009', 'vision-010', 'vision-028', 'ondevice-038', 'ondevice-043'] },
  { title: 'MCP와 실행 흐름', focus: 'MCP 연결·도구·Agent를 이어서 풉니다. 생성·학습 흐름과 평가 metric, 재양자화를 반복합니다.',
    anchors: ['llm-006', 'llm-008', 'rag-015', 'rag-017', 'data-001', 'data-007', 'vision-018', 'vision-025', 'ondevice-031', 'ondevice-008'] },
  { title: '생성과 모델 변형', focus: 'Attention과 모델 출력, Chat Completion·MCP 활용, 확산의 noisy 입력·노이즈 정답, LLM 경량화를 연결합니다.',
    anchors: ['llm-003', 'llm-005', 'rag-009', 'rag-018', 'data-022', 'data-026', 'vision-013', 'vision-014', 'ondevice-015', 'ondevice-018'] },
  { title: '핵심 기출 흐름 재암기', focus: '로드·LoRA, 벡터 검색·프롬프트 생성을 다시 반복합니다. 추천 데이터 흐름과 양자화 기본식도 확인합니다.',
    anchors: ['llm-019', 'llm-009', 'rag-004', 'rag-006', 'data-010', 'data-017', 'vision-004', 'vision-016', 'ondevice-004', 'ondevice-005'] },
  { title: '최종 종합 점검', focus: '학습·추론의 주요 레이어와 출력 연결, KG·MCP, 데이터 구성·학습, 증강·손실, 프루닝·증류를 종합합니다.',
    anchors: ['llm-042', 'llm-005', 'rag-012', 'rag-017', 'data-016', 'data-001', 'vision-001', 'vision-025', 'ondevice-001', 'ondevice-008'] },
];

export const fixedExams = plans.map((plan, index) => {
  const selected = plan.anchors.map(id => {
    const q = bank.questions.find(q => q.id === id);
    if (!q || q.sourceId === 'dpo-completions') throw new Error(`고정 모의고사 출처 오류: ${id}`);
    return q;
  });
  const cellIds = selected.map(q => q.sourceId);
  if (cellIds.length !== 10 || new Set(cellIds).size !== 10) throw new Error('고정 모의고사 셀 중복');
  for (const subject of ['LLM', 'RAG', 'Data', 'Vision', 'On-device']) {
    if (selected.filter(q => q.subject === subject).length !== 2) throw new Error('과목별 2셀 구성 오류');
  }
  return { ...plan, number: index + 1, cellIds, blankCount: bank.questions.filter(q => cellIds.includes(q.sourceId)).length };
});
