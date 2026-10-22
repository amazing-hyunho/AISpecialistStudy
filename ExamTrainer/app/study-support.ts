import { chapterConcepts } from './handbook/concepts';

type Support = { concept: string; hint: string; flow: string; caution: string };
type Rule = Support & { match: RegExp };
const rules: Rule[] = [
  { match: /Padding Mask/, concept: '길이가 다른 문장을 배치로 묶으면 채움 토큰이 생깁니다. 유효 토큰 표시를 통해 채움 위치가 실제 문맥으로 취급되지 않게 합니다.', hint: '토큰 ID 중 채움 토큰에 해당하는 위치를 구분하세요. 이 라이브러리가 유효 위치와 무시할 위치를 어떤 값으로 나타내는지 확인하세요.', flow: '토큰 ID → 채움 여부 비교 → 유효 위치 mask', caution: '라이브러리에 따라 True가 유지 또는 무시를 뜻할 수 있습니다. 인과 마스크와 padding mask는 목적이 다릅니다.' },
  { match: /평가 Metric|평가 정답 개수|Mask Threshold/, concept: '평가는 모델의 연속적인 출력 점수를 과제에 맞는 예측으로 해석한 뒤 정답과 비교합니다. 분류·분할·추천은 비교 단위가 다릅니다.', hint: '클래스 하나를 고르는지, 픽셀별 경계를 적용하는지, 추천 순위를 비교하는지 구분하고 정답과 같은 단위로 맞추세요.', flow: '출력 점수 → 과제별 예측 → 정답과 비교 → 집계', caution: '배치별 비율의 단순 평균과 전체 표본 기준 비율은 배치 크기가 다르면 달라집니다.' },
  { match: /Device/, concept: '모델 파라미터와 연산할 입력 Tensor는 호환되는 장치에 있어야 합니다. 장치 이동은 모델 구조나 학습·평가 모드 변경과 별개입니다.', hint: '모델이 놓인 장치를 확인하고 함께 연산할 입력과 정답이 같은 장치에 있는지 확인하세요.', flow: '데이터 준비 → 장치 정렬 → 모델 연산', caution: 'Tensor의 장치 이동 결과를 필요한 변수에 받아야 합니다. train/eval 설정은 장치를 옮기지 않습니다.' },
  { match: /헤드 분리/, concept: '멀티헤드 Attention은 하나의 특징 벡터를 여러 부분 공간으로 나눠 서로 다른 관계를 병렬로 계산합니다.', hint: '원소 수를 유지하면서 마지막 특징 축 하나를 두 축으로 나눠보세요. 두 축 크기의 곱은 원래 특징 크기여야 합니다.', flow: '(B,T,D) → (B,T,H,D/H)', caution: '축을 나누는 것과 축 순서를 교환하는 것은 다릅니다. D가 헤드 수로 나누어져야 합니다.' },
  { match: /헤드 축/, concept: '헤드별 연산을 하려면 헤드 축이 시간 축보다 앞에 있어야 각 헤드의 토큰 행렬을 독립적으로 계산할 수 있습니다.', hint: '배치와 헤드 내부 차원은 그대로 두고, 가운데 두 축의 위치만 바꿔보세요.', flow: '(B,T,H,Dh) → (B,H,T,Dh)', caution: 'reshape만으로 축의 의미를 교환하면 원소 대응이 달라질 수 있습니다.' },
  { match: /헤드 재결합/, concept: '각 헤드가 만든 정보를 토큰별로 이어 붙여 원래 모델 차원의 표현으로 돌립니다.', hint: '축 교환 뒤 메모리 배치를 먼저 정리하고, 마지막 두 축을 합쳐야 합니다.', flow: '(B,T,H,Dh) → (B,T,H×Dh)', caution: 'transpose 결과는 비연속 메모리일 수 있어 view 전에 연속성을 확인합니다.' },
  { match: /정답 구간|타깃 청크|입력 청크|Encoder 입력 구간|입력 시프트|타깃 시프트|다음 토큰 예측|자동회귀 시프트/, concept: '학습 입력과 정답은 시간적으로 정렬되어야 합니다. 다음 토큰 학습은 한 시점 뒤, 시계열 예측은 입력 구간 직후의 미래를 정답으로 둡니다.', hint: '입력의 시작·끝을 먼저 표시하고, 정답이 시작할 시점과 필요한 길이를 계산하세요. slice의 끝은 포함되지 않습니다.', flow: '과거/현재 입력 → 그 다음 시점 또는 다음 구간의 정답', caution: '다음 토큰의 한 칸 시프트와 시계열의 미래 구간 예측을 혼동하지 마세요.' },
  { match: /Decoder 초기 입력|배치 차원|Mask 채널/, concept: '모델은 각 축에 배치·시간·특징 같은 의미를 부여합니다. 길이 1의 축을 추가하거나 제거해도 다른 축의 의미는 유지해야 합니다.', hint: '현재 shape와 필요한 shape를 나란히 적고, 길이 1인 축이 어느 위치에 필요한지 찾아보세요.', flow: '(B,F) ↔ (B,1,F), 이미지 mask는 (H,W) → (1,H,W)', caution: '축을 지정하지 않고 squeeze하면 배치 크기 1일 때 배치 축까지 사라질 수 있습니다.' },
  { match: /예측 시간 축|stack\(/, concept: '시간별 출력 목록을 하나의 Tensor로 묶으려면 새 시간 축이 필요합니다. 기존 축을 늘리는 연결과 새 축을 만드는 쌓기는 다릅니다.', hint: '목록 원소가 (B,F)라면 최종 결과 (B,T,F)의 T는 새로 생기는 축입니다.', flow: 'T개의 (B,F) → (B,T,F)', caution: 'cat은 기존 축을 늘리고 stack은 새로운 축을 만듭니다.' },
  { match: /토큰 연결|Embedding 결합|Skip Connection|Layer 결합/, concept: '여러 표현을 연결하면 선택한 축의 길이가 늘어납니다. 같은 샘플의 표현을 결합하려면 배치 축을 유지해야 합니다.', hint: '새 축을 만들지 말고 어느 기존 축이 늘어나야 하는지 생각하세요. 다른 축의 크기는 같아야 합니다.', flow: '특징 결합은 특징 축, 생성 토큰 추가는 시간 축', caution: '덧셈 기반 residual은 shape를 유지하고 concatenate는 선택한 축의 크기를 늘립니다.' },
  { match: /Residual|잔차/, concept: '잔차 연결은 변환된 표현에 원래 입력을 더해 정보를 보존하고 기울기가 지나갈 직접 경로를 제공합니다.', hint: '블록의 변환 결과만 반환하지 말고, 같은 shape의 원래 입력이 어떤 경로로 다시 합류하는지 보세요.', flow: '입력 x → 변환 F(x) → 원래 x와 결합', caution: '더할 두 Tensor의 shape가 맞아야 합니다. 채널을 늘리는 concat과 다릅니다.' },
  { match: /Gradient 초기화|기울기 초기화|zero_grad/, concept: 'PyTorch의 기울기는 기본적으로 누적됩니다. 배치별로 독립적인 갱신을 하려면 이전 기울기를 초기화해야 합니다.', hint: '현재 배치의 역전파 전에 optimizer에 남아 있는 이전 배치 정보를 어떻게 처리할지 생각하세요.', flow: '초기화 → forward → loss → backward → update', caution: '의도적인 gradient accumulation에서는 매 배치마다 초기화하지 않을 수 있습니다.' },
  { match: /역전파|가중치 갱신|Optimizer/, concept: '손실로부터 미분값을 계산하는 과정과 그 값으로 파라미터를 수정하는 과정은 분리되어 있습니다.', hint: '지금 필요한 것이 미분 계산인지, 계산된 기울기로 파라미터를 바꾸는 작업인지 구분하세요.', flow: '손실 → 기울기 계산 → optimizer 갱신', caution: 'backward만 호출하면 기울기는 생기지만 가중치가 자동 갱신되지는 않습니다.' },
  { match: /그래디언트 해제|Teacher Forward|평가.*|학습 모드/, concept: '학습·평가 모드는 Dropout/BatchNorm의 동작을 바꾸고, 기울기 기록 여부는 별도로 제어합니다.', hint: '레이어의 동작 모드를 바꾸는 설정과 연산 그래프를 기록하지 않는 설정을 구분하세요.', flow: '학습: 기울기 기록·갱신 / 평가: 예측·집계', caution: 'eval만으로 기울기 계산이 꺼지지 않습니다. teacher만 끄고 student의 학습 경로는 유지해야 합니다.' },
  { match: /채널 중요도|importance.*sum/, concept: '채널 단위 중요도는 그 채널에 연결된 가중치들의 크기를 모아 계산합니다. 남기고 싶은 축 이외의 축을 줄입니다.', hint: '입력 채널별 값 하나를 남기려면 출력 채널과 두 공간 축을 합쳐야 합니다. broadcast에 필요한 축은 길이 1로 남겨보세요.', flow: '(Cout,Cin,Kh,Kw) → (1,Cin,1,1)', caution: '입력 채널과 출력 채널의 pruning은 합산 축이 다릅니다.' },
  { match: /Threshold|Mask|Pruning|Importance|importance|Sparsity|sparsity/, concept: '프루닝은 중요도 기준으로 일부 가중치나 채널의 기여를 제거합니다. 목표 희소도, 중요도, 임계값, 유지 mask는 서로 다른 단계입니다.', hint: '현재 빈칸이 제거 수·중요도·경계값·유지 여부 중 무엇을 구하는 단계인지 먼저 찾으세요.', flow: '중요도 → 제거 수/순위 → 임계값 → mask 적용', caution: 'mask의 True가 유지인지 확인하세요. 동률과 제거 수 0 같은 경계조건에 따라 처리가 달라집니다.' },
  { match: /Quantization|Requantization|Zero Point|Linear Quantization|Scale 복원|Smoothing|SmoothQuant|AWQ Scale/, concept: '양자화는 연속 실수를 제한된 정수 눈금으로 표현합니다. scale은 눈금 간격이고 zero point는 실수 0의 정수 위치입니다.', hint: '실수→정수인지 정수→실수인지 먼저 구분하세요. 연산 출력이라면 입력·가중치·출력의 눈금 간격을 연결해야 합니다.', flow: 'scale·zero point → 반올림·범위 제한 → 정수 표현 / 필요 시 복원', caution: '양자화와 역양자화는 scale과 zero point를 적용하는 방향이 반대입니다.' },
  { match: /Distillation|Loss 결합|Representation|Feature.map|Soft Target|Student Probability/, concept: '증류는 teacher가 가진 예측 분포나 중간 표현을 student가 따라 배우게 합니다. 실제 label 손실은 과제의 정답을 직접 지도합니다.', hint: '무엇을 맞추는지 먼저 찾으세요: 클래스 분포, 숨은 표현, feature map 중 하나입니다. 정답 label 손실과의 결합도 확인하세요.', flow: 'teacher·student 출력 → 표현/분포 비교 → label 손실과 결합', caution: 'teacher는 고정하고 student에는 기울기를 전달합니다. 두 표현의 크기와 손실 함수의 입력 형식을 맞춰야 합니다.' },
  { match: /Loss|손실|Cross Entropy|로그확률/, concept: '손실은 모델 출력과 정답의 차이를 학습 가능한 수치로 만듭니다. 클래스 인덱스·픽셀 mask·노이즈 등 과제에 따라 정답의 의미가 달라집니다.', hint: '손실 함수가 raw logits, 확률, 로그확률 중 무엇을 받는지 확인하고 정답의 shape와 타입을 맞춰보세요.', flow: '모델 출력 + 과제별 정답 → scalar loss → 역전파', caution: 'CrossEntropy는 logits, NLL은 로그확률, BCEWithLogits는 sigmoid 전 logits를 사용합니다.' },
  { match: /Greedy|마지막 시점|클래스 선택|Accuracy|Top-1|Confusion|RMSE|MAPE/, concept: '평가나 생성에는 모델 점수를 실제 예측으로 해석하는 단계가 필요합니다. 예측을 고르는 축과 통계를 집계하는 축을 구분합니다.', hint: '시간·클래스·배치 축 중 어느 축에서 선택하고 어느 축에서 집계해야 하는지 생각하세요.', flow: '점수 → 예측값/인덱스 → 정답 비교 또는 다음 입력', caution: '정확도는 점수 평균이 아니라 정답 비율입니다. 마지막 시점 선택과 클래스 argmax는 서로 다른 연산입니다.' },
  { match: /임베딩|Embedding|출력 헤드|Layer|투영|QKV|Q·K|Value|Q 투영|K 투영|V 투영/, concept: '레이어는 입력 표현을 다음 단계가 요구하는 차원으로 변환합니다. 파라미터 shape는 입력·출력 특징 수와 연산 목적에 의해 결정됩니다.', hint: '입력 마지막 차원과 필요한 출력 마지막 차원을 먼저 적으세요. 토큰 ID를 벡터로 바꾸는 lookup인지 벡터를 투영하는 연산인지 구분하세요.', flow: '입력 특징 차원 → 레이어 변환 → 다음 모듈의 입력 차원', caution: '배치 크기·시퀀스 길이와 학습 파라미터의 특징 차원을 혼동하지 마세요.' },
  { match: /어텐션|Attention|문맥 벡터/, concept: 'Attention은 Q와 K로 관련도를 계산하고 이를 정규화한 가중치로 V의 정보를 모읍니다.', hint: '비교할 정보와 실제로 가져올 정보를 구분하세요. 행렬 곱에서 안쪽 두 축이 맞는지도 확인하세요.', flow: 'Q·K 점수 → 마스크·정규화 → V 가중합', caution: '점수 행렬과 최종 문맥 벡터는 shape와 역할이 다릅니다. 미래 토큰 마스크는 softmax 전에 적용합니다.' },
  { match: /LoRA|동결|미세조정|레이어 교체/, concept: '효율적 미세조정은 기존 모델 전체를 바꾸기보다 선택한 파라미터나 저랭크 보정 경로를 학습합니다.', hint: '원래 가중치를 학습할지 고정할지, 보정 경로의 입력·중간·출력 차원이 무엇인지 생각하세요.', flow: '기존 경로 고정/선택 → 작은 보정 또는 일부 층 학습 → 출력 결합', caution: '학습 가능 여부와 train/eval 모드는 다릅니다. LoRA rank는 출력 클래스 수가 아닙니다.' },
  { match: /MCP|Agent|도구 조회/, concept: 'MCP 연결은 외부 도구를 사용하는 통로이고, Agent는 도구 설명을 바탕으로 호출을 조율합니다. 실행 context는 workflow 상태입니다.', hint: '연결 객체, 도구 명세, 도구 목록, Agent 실행 중 지금 어느 단계인지 구분하세요.', flow: 'Client → 도구 명세 → 도구 목록 → Agent → 실행 결과', caution: 'run의 handler와 최종 답변을 구분하고 비동기 결과를 기다려야 합니다.' },
  { match: /Prompt|메시지|Chat Completion|생성으로|KG|혼합 RAG/, concept: 'RAG는 검색 결과를 근거 문맥으로 구성해 생성 모델에 전달합니다. 검색 결과를 얻는 것만으로 답변 생성이 끝나지는 않습니다.', hint: '지침, 사용자 질문, 검색 근거가 각각 어디에 담겨 다음 단계로 전달되는지 따라가세요.', flow: '검색/KG 결과 → 근거 텍스트 → 질문과 메시지 구성 → 응답', caution: '강의의 혼합 RAG는 도메인에 따른 선택일 수 있습니다. 항상 모든 결과를 합친다고 가정하지 마세요.' },
  { match: /검색|Retriever|인덱스|Query Engine|문서|Node/, concept: '문서를 검색 단위로 나누고 인덱스로 조직한 뒤 질문과 관련된 부분을 찾습니다. retriever와 query engine은 담당 범위가 다릅니다.', hint: '문서 읽기·분할·인덱싱·검색·응답 합성 중 빈칸의 역할을 찾고, 반환값이 노드인지 문자열인지 구분하세요.', flow: 'Document → Node → index → retrieve/query', caution: '검색 결과 객체에는 점수와 노드가 포함될 수 있어 본문을 따로 꺼내야 합니다.' },
  { match: /transform|Transform|Augmentation|정규화|좌우|Tensor 변환|전처리/, concept: '전처리는 모델이 기대하는 입력 형태와 분포를 만듭니다. 학습 증강은 다양한 예제를 만들고 평가 전처리는 일관된 비교를 돕습니다.', hint: '입력의 타입·shape·값 범위를 확인하고, 변환들이 어떤 순서로 적용돼야 하는지 생각하세요.', flow: '원시 입력 → 형태 변환 → 학습 분포에 맞춘 수치 변환', caution: '학습용 무작위 증강과 평가용 처리를 구분하고, 정규화 통계에 평가 정보를 섞지 않도록 주의합니다.' },
  { match: /Decoder|Encoder|Forward|모델 출력|예측을|시점별|Device/, concept: '시퀀스 모델은 입력과 hidden state를 받아 출력 및 다음 상태를 만듭니다. 각 단계가 요구하는 배치·시간·특징 축을 유지해야 합니다.', hint: '직전 단계가 반환한 값 중 다음 단계에 넘길 것은 무엇인지, 길이 1의 시간 축이 필요한지 확인하세요.', flow: '입력·상태 → 모델 → 출력·새 상태 → 후속 단계', caution: '정답을 다음 입력으로 넣는 방식과 이전 예측을 다시 넣는 방식은 다릅니다. 데이터와 모델의 device도 맞아야 합니다.' },
];

export function studySupport(q: { chapterId: string; topic: string; answer: string }): Support {
  const rule = rules.find(rule => {
    // Mask also appears in attention and padding; pruning guidance belongs only to pruning.
    if (rule.match.source.includes('Threshold') && !q.chapterId.startsWith('ondevice')) return false;
    if (rule.match.source.includes('평가.*') && !/그래디언트 해제|Teacher Forward|학습 모드|평가 모드/.test(q.topic)) return false;
    return rule.match.test(q.topic);
  });
  if (rule) return { concept: rule.concept, hint: rule.hint, flow: rule.flow, caution: rule.caution };
  const chapter = chapterConcepts[q.chapterId];
  return {
    concept: chapter.concept,
    hint: '빈칸 앞뒤 변수의 역할을 보고 입력·출력의 타입과 shape를 먼저 적어보세요. 값을 만드는 단계인지, 변환하는 단계인지, 다음 단계로 넘기는 부분인지 구분하세요.',
    flow: chapter.flow,
    caution: chapter.caution,
  };
}
