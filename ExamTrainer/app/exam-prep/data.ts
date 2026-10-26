import materialQuestions from './material-questions.json';
import bank from '../question-bank.json';
import { questionExplanations } from '../explanations';
import { practiceChoices, type BankQuestion } from '../choice-practice-data';
import { normalized } from '../grading';
import { suppliedInExams, examTargets, examHints } from './exam-design';

export const subjects = ['LLM', 'RAG', 'Data', 'Vision', 'On-device'];
type Choice = { id: number; text: string; correct: boolean; reason: string };
export type PrepQuestion = { id: string; subject: string; topic: string; prompt: string; answer: string; context: string; fullCode: string; cellKey: string; start: number; end: number; source: string; kind: string; explanation: string; choices: Choice[]; hint?: string };
export type Collection = { id: string; title: string; description: string; questionIds: string[] };
const range = (prefix: string, start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => `${prefix}-${String(start + i).padStart(3, '0')}`);
const unique = (ids: string[]) => [...new Set(ids)];
const cells = bank.cells as Record<string, { source: string; cell: number; answerSource: string; sourceKind?: string }>;
function fromBank(q: BankQuestion): PrepQuestion {
  const cell = materialQuestions.find(item => item.question.id === q.id) ?? cells[q.sourceId];
  if ('sourceKind' in cell && cell.sourceKind === 'reconstructed') throw new Error(`Unverified source: ${q.id}`);
  const material = materialQuestions.find(item => item.question.id === q.id);
  const target = material?.blank ?? q.answer;
  const occurrence = material?.blankOccurrence ?? q.occurrence;
  let start = -1, from = 0;
  for (let i=0;i<=occurrence;i++) { start=cell.source.indexOf(target,from); if(start<0) throw new Error(`Missing blank: ${q.id}`); from=start+target.length; }
  return { id:q.id, subject:q.subject, topic:q.topic, prompt:q.prompt, answer:q.answer,
    fullCode:cell.source, cellKey:`${cell.answerSource.split('/').pop()}:${cell.cell}`, start, end:from,
    context:cell.source.slice(0,start)+'【빈칸】'+cell.source.slice(from), source:`${cell.answerSource} · 셀 ${cell.cell}`,
    kind: target.includes('????') ? '원본 실습 빈칸 · 해설 답안' : '강의 코드',
    explanation:q.id==='material-vit-value' ? 'J축을 따라 attention 가중치와 Value를 합산해 (B,H,I,D)를 만듭니다.' : questionExplanations[q.id]?.why ?? q.prompt,
    choices:practiceChoices(q) };

}
export const topicBanks: (Collection & { subject: string; priority: string })[] = [
  { id: 'mha', subject: 'LLM', title: 'MHA 헤드와 텐서 축', priority: '우선', description: '4월 1차·2차·9월에 Attention이 반복됩니다. 모델별 구현 맥락은 다릅니다.', questionIds: range('llm',89,94) },
  { id: 'gpt', subject: 'LLM', title: 'GPT 구성·생성', priority: '우선', description: '6월 GPT, 9월 구성·생성 구현. 5월은 GPT-DPO로 별도 분류합니다.', questionIds: ['llm-005','llm-006',...range('llm',49,56),'llm-095'] },
  { id: 'dpo', subject: 'LLM', title: 'DPO 데이터·토큰화·손실', priority: '우선', description: '4월 2차·5월 반복. 원본 셀 0의 토큰화·시프트·gather·DPO 손실 빈칸과 모델 로드를 함께 연습합니다.', questionIds: [...range('llm',19,25),...range('llm',14,16),...range('llm',83,88)] },
  { id: 'lora', subject: 'LLM', title: 'LoRA 직접 구현·설정', priority: '보완', description: '4월 2차 설정 문제는 강의의 rank·alpha와 직접 구현 LoRA로 연습합니다.', questionIds: [...range('llm',9,13),'llm-017','llm-018'] },
  { id: 'spam', subject: 'LLM', title: 'Spam/Ham 분류', priority: '보완', description: '4월 1차 명시. 라벨·분류 출력·미세조정 범위를 확인합니다.', questionIds: range('llm',67,75) },
  { id: 'rag-basic', subject: 'RAG', title: '검색·프롬프트·기본 API', priority: '우선', description: '모든 회차에 RAG 계열 등장. 9월은 인덱스·Query Engine·메시지를 명시합니다.', questionIds: [...range('rag',1,9),'rag-022','rag-023','rag-024','rag-025','rag-029'] },
  { id: 'kg', subject: 'RAG', title: 'KG와 혼합 검색', priority: '우선', description: '4월 1차·2차 반복. KG 질의와 일반 검색의 연결을 확인합니다.', questionIds: range('rag',10,13) },
  { id: 'mcp', subject: 'RAG', title: 'MCP 연결·도구·Agent', priority: '보완', description: '6월 client 선언부 복기. Agent 실행은 연결 흐름 보완입니다.', questionIds: [...range('rag',14,18),...range('rag',26,28)] },
  { id: 'window', subject: 'Data', title: '시계열 Sliding window', priority: '우선', description: '4월 2차·9월의 구간 생성. 4월 1차 시계열은 구체 구현 미상입니다.', questionIds: [...range('data',43,47),'data-034','data-035','data-042'] },
  { id: 'conv', subject: 'Data', title: 'Conv1D forward', priority: '보완', description: '4월 2차에 명시된 축 변환·합성곱·출력 연결입니다.', questionIds: ['data-022','data-023',...range('data',48,51)] },
  { id: 'seq', subject: 'Data', title: 'RNN Encoder–Decoder', priority: '우선', description: '9월 상세 복기. 상태 전달과 자기회귀 예측을 연습합니다.', questionIds: [...range('data',26,29),...range('data',36,41)] },
  { id: 'ngcf', subject: 'Data', title: 'NGCF 추천', priority: '보완', description: '5월 명시. 그래프 메시지 전달·임베딩 결합을 확인합니다.', questionIds: [...range('data',10,14),...range('data',30,33)] },
  { id: 'ncf', subject: 'Data', title: 'NCF 추천', priority: '보완', description: '6월 명시. NGCF와 다른 추천 모델입니다.', questionIds: range('data',16,18) },
  { id: 'resnet', subject: 'Vision', title: 'ResNet18·분류', priority: '우선', description: '4월 1차·6월 반복. CIFAR stem과 분류 평가를 연습합니다.', questionIds: ['vision-002','vision-003','vision-016','vision-032'] },
  { id: 'transform', subject: 'Vision', title: 'CIFAR10 전처리', priority: '우선', description: '4월 1차 CIFAR10, 9월 전처리 상세 복기.', questionIds: ['vision-001','vision-019','vision-020','vision-036','vision-037'] },
  { id: 'detr', subject: 'Vision', title: 'DETR 추론·ViT 유사 유형', priority: '보완', description: '4월 2차 내부 구현은 ViT 강의의 Attention·잔차 연결로 연습합니다. 5월 COCO는 DETR 추론 후보입니다.', questionIds: ['vision-007','vision-008','vision-009','vision-004','vision-005','vision-024','vision-035','material-vit-value'] },
  { id: 'residual', subject: 'Vision', title: 'Transformer residual', priority: '우선', description: '9월 Attention·FFN residual 명시. QKV·점수는 관련 보완입니다.', questionIds: ['vision-004','vision-005','vision-024','vision-035'] },
  { id: 'kernel', subject: 'On-device', title: 'Kernel pruning', priority: '우선', description: '4월 1차·6월 반복. 공간 축 (2,3) 합산을 확인합니다.', questionIds: range('ondevice',65,70) },
  { id: 'channel', subject: 'On-device', title: 'Channel pruning', priority: '우선', description: '5월·9월 반복. 9월은 입력 채널을 남기는 (0,2,3) 합산입니다.', questionIds: range('ondevice',61,64) },
  { id: 'quant', subject: 'On-device', title: 'Quantization', priority: '보완', description: '4월 2차 명시. scale·zero point·재양자화를 연습합니다.', questionIds: [...range('ondevice',4,7),'ondevice-029','ondevice-030','ondevice-031','ondevice-032'] },
  { id:'data-learning',subject:'Data',title:'학습 연결·평가 지표',priority:'PDF 기준',description:'출제포인트의 예측·정답·손실·역전파 연결 및 RMSE·MAPE 평가를 강의 코드로 확인합니다.',questionIds:range('data',1,8) },
  { id:'vision-learning',subject:'Vision',title:'분류 학습·평가',priority:'PDF 기준',description:'출제포인트의 모델 출력과 정답을 학습으로 연결하고 정확도를 계산합니다.',questionIds:['vision-025','vision-026','vision-027','vision-033','vision-034'] },
  { id:'distillation',subject:'On-device',title:'지식증류',priority:'PDF 기준',description:'출제포인트에 명시된 Teacher 예측·정답을 활용한 Student 학습입니다.',questionIds:[...range('ondevice',8,11),...range('ondevice',35,37)] },
  { id:'llm-learning',subject:'LLM',title:'언어 모델 학습·손실',priority:'PDF 기준',description:'출제포인트의 학습 대상과 필요한 작업을 cross entropy·기울기 초기화·역전파·가중치 갱신으로 확인합니다.',questionIds:['llm-007','llm-008','llm-058','llm-060','llm-066'] },
];
const topics = (...ids: string[]) => unique(ids.flatMap(id => {
  const topic = topicBanks.find(t => t.id === id);
  if (!topic) throw new Error(`Unknown topic: ${id}`);
  return topic.questionIds;
}));
export const monthlyBanks: Collection[] = [
  { id:'apr1', title:'4월 1차', description:'MHA·spam/ham / KG 검색 / kernel / ResNet18 / 시계열. 시계열 세부 문제는 기본 window로 구성한 대응 연습입니다.', questionIds:unique([...topics('mha','spam','kg','rag-basic','kernel','resnet','transform'),...range('data',43,47)]) },
  { id:'apr2', title:'4월 2차', description:'DPO·LoRA / retriever·KG·prompt / quantization / ViT Attention·residual / sliding window·Conv1D. LoRA 설정·DETR 내부 구현 복기는 강의에 있는 유사 유형으로 연습합니다.', questionIds:unique([...topics('dpo','lora','rag-basic','kg','quant','detr'),...range('data',43,47),...topics('conv')]) },
  { id:'may', title:'5월', description:'GPT-DPO / RAG / channel / COCO / NGCF. COCO는 DETR 추론 후보, RAG 세부 항목은 대응 연습입니다.', questionIds:unique([...topics('dpo','rag-basic','channel','ngcf'),'vision-007','vision-008','vision-009']) },
  { id:'jun', title:'6월', description:'GPT / MCP·RAG / kernel / ResNet18 / NCF. GPT·ResNet의 세부 구현은 강의 코드에서 선별한 대응 연습입니다.', questionIds:topics('gpt','mcp','rag-basic','kernel','resnet','ncf') },
  { id:'sep', title:'9월', description:'헤드 분리·GPT 생성 / 기본 RAG / 채널 pruning / 전처리·residual / Encoder–Decoder. 저장된 9월 복기 원문 기준입니다.', questionIds:unique([...topics('mha','gpt','transform','channel'),'rag-001','rag-029','rag-024','vision-024','vision-035','data-034','data-035','data-042',...range('data',36,41)]) },
];

export const monthlyExams: Collection[] = monthlyBanks.map(b => ({...b, id:`exam-${b.id}`, title:`${b.title} 복기 모의고사`, questionIds:b.questionIds.filter(id=>!suppliedInExams.has(id))}));
export const predictedExams: Collection[] = [
  { id:'predict-1', title:'예상 모의고사 1회 · 반복 핵심', description:'MHA·GPT / 검색·KG / window·Conv1D·RNN / ResNet·전처리·학습 / kernel·channel·양자화·증류', questionIds:[
    'llm-089','llm-092','llm-049','llm-006','llm-094',
    'rag-001','rag-029','rag-005','rag-024','rag-012',
    'data-044','data-045','data-048','data-003','data-041',
    'vision-002','vision-001','vision-036','vision-016','vision-026',
    'ondevice-009','ondevice-067','ondevice-064','ondevice-063','ondevice-029'] },
  { id:'predict-2', title:'예상 모의고사 2회 · 학습과 모델 연결', description:'DPO·LoRA·분류 / KG·MCP / NGCF·NCF / DETR 추론·ViT residual / pruning·양자화·증류', questionIds:[
    'llm-020','llm-016','llm-085','llm-009','llm-070',
    'rag-010','rag-013','rag-015','rag-026','rag-017',
    'data-010','data-011','data-014','data-017','data-018',
    'vision-008','vision-009','vision-005','vision-024','vision-035',
    'ondevice-068','ondevice-010','ondevice-035','ondevice-006','ondevice-036'] },
  { id:'predict-3', title:'예상 모의고사 3회 · 구현 종합', description:'생성·학습·DPO·LoRA / 검색·prompt·MCP / window·Conv1D·Seq2Seq·추천 / 분류·Attention / pruning·증류', questionIds:[
    'llm-093','llm-007','llm-056','llm-083','llm-010',
    'rag-023','rag-006','rag-011','rag-027','rag-028',
    'data-046','data-050','data-040','data-032','data-016',
    'vision-003','vision-037','vision-004','material-vit-value','vision-027',
    'ondevice-070','ondevice-008','ondevice-061','ondevice-037','ondevice-069'] },
];
const used = new Set([...monthlyBanks,...topicBanks,...predictedExams].flatMap(c => c.questionIds));
export const prepQuestions: Record<string, PrepQuestion> = Object.fromEntries([
  ...[...bank.questions.filter(q => !materialQuestions.some(item => item.question.id === q.id)), ...materialQuestions.map(item => item.question)].filter(q => used.has(q.id)).map(fromBank),
].map(q => [q.id,q]));
// Resolve original exercise ???? using the existing material answers, then narrow
// only the exam's spans. The bank retains its original full-answer exercises.
export const examQuestions: Record<string,PrepQuestion> = {};
for (const q of Object.values(prepQuestions)) {
  const siblings = Object.values(prepQuestions).filter(other=>other.cellKey===q.cellKey).sort((a,b)=>a.start-b.start);
  let source=q.fullCode, shift=0, start=q.start;
  for (const other of siblings) {
    const original=q.fullCode.slice(other.start,other.end);
    if (!original.includes('????')) continue;
    const position=other.start+shift;
    source=source.slice(0,position)+other.answer+source.slice(position+original.length);
    if (other.start<q.start) start+=other.answer.length-original.length;
    shift+=other.answer.length-original.length;
  }
  const answer=examTargets[q.id] ?? q.answer;
  let offset=q.answer.indexOf(answer);
  if (q.id==='llm-085') {
    // Ask the gather operation rather than memorizing its input variable name.
    start=source.lastIndexOf('torch.gather',start);
    offset=0;
  }
  if (offset<0 || start<0) throw new Error(`Invalid exam target: ${q.id}`);
  start+=offset;
  // Original material sometimes hides only ????; all resolved spans now contain
  // the existing answer, so every exam substring is directly verifiable.
  if (source.slice(start,start+answer.length)!==answer) throw new Error(`Exam source mismatch: ${q.id}`);
  const narrowed=Boolean(examTargets[q.id]);
  const hint=examHints[q.id] ?? `${q.prompt} ${narrowed ? '인수와 설정은 코드에 제공됩니다. 함수·클래스·메서드 또는 지정된 부분만 작성하세요.' : '주변 코드의 변수와 shape를 이용해 현재 빈칸의 실행 코드를 작성하세요.'}`;
  examQuestions[q.id]={...q,answer,fullCode:source,start,end:start+answer.length,hint,
    prompt:narrowed ? '제공된 코드와 빈칸별 힌트를 보고 핵심 부분만 완성하세요.' : q.prompt,
    context:source.slice(0,start)+'【빈칸】'+source.slice(start+answer.length)};
}
export function isCorrect(id: string, answer: string, exam=false) {
  return Boolean(answer.trim()) && normalized(answer) === normalized((exam ? examQuestions : prepQuestions)[id].answer);
}
export function results(ids: string[], answers: Record<string,string>, exam=false) {
  return subjects.map(subject => {
    const subset = ids.filter(id => prepQuestions[id].subject === subject);
    return {subject,total:subset.length,correct:subset.filter(id => isCorrect(id,answers[id] ?? '',exam)).length};
  });
}
for (const collection of [...monthlyBanks,...topicBanks,...predictedExams]) {
  if (new Set(collection.questionIds).size !== collection.questionIds.length) throw new Error(`Duplicate questions: ${collection.id}`);
  for (const id of collection.questionIds) if (!prepQuestions[id]) throw new Error(`Missing question: ${id}`);
}
for (const exam of predictedExams) for (const subject of subjects) {
  if (exam.questionIds.filter(id => prepQuestions[id].subject === subject).length !== 5) throw new Error(`Unbalanced exam: ${exam.id}`);
}

export function cellQuestions(ids: string[], id: string, exam=false) {
  const questions=exam ? examQuestions : prepQuestions;
  return ids.map(key=>questions[key]).filter(q=>q.cellKey===questions[id].cellKey).sort((a,b)=>a.start-b.start);
}
export function cellParts(ids: string[], id: string, exam=false) {
  const questions=cellQuestions(ids,id,exam), source=(exam ? examQuestions : prepQuestions)[id].fullCode;
  let cursor=0;
  const parts: {text?:string; question?:PrepQuestion}[]=[];
  for(const q of questions) {
    if(q.fullCode!==source || q.start<cursor) throw new Error(`Overlapping/inconsistent cell: ${q.id}`);
    parts.push({text:source.slice(cursor,q.start)},{question:q});cursor=q.end;
  }
  parts.push({text:source.slice(cursor)});return parts;
}

export function choicePreview(ids: string[], id: string) {
  const marker = '【현재 빈칸】';
  const masked = cellParts(ids,id).map(part => part.question
    ? part.question.id === id ? marker : `【빈칸 ${ids.indexOf(part.question.id)+1}】`
    : part.text).join('');
  const start = masked.indexOf(marker);
  const before = masked.slice(0,start).split('\n');
  const after = masked.slice(start+marker.length).split('\n');
  return `${before.length>6 ? '⋮\n' : ''}${before.slice(-6).join('\n')}${marker}${after.slice(0,6).join('\n')}${after.length>6 ? '\n⋮' : ''}`;
}
