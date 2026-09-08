export type ChapterConcept = {
  concept: string;
  flow: string;
  caution: string;
};

// 학습을 돕는 개념 요약입니다. 시험 정답 코드는 원본 문제은행을 유지합니다.
export const chapterConcepts: Record<string, ChapterConcept> = {
  'llm-02': {
    concept: '언어 모델은 앞의 토큰을 보고 다음 토큰을 예측합니다. 토크나이저는 텍스트를 정수 ID로 바꾸고, 임베딩은 그 ID를 학습 가능한 벡터로 바꿉니다. Dataset은 학습 샘플을 정의하고 DataLoader는 샘플을 배치로 묶습니다.',
    flow: '텍스트 인코딩 → 일정 길이의 입력 청크 추출 → 한 칸 뒤로 이동한 타깃 청크 추출 → 배치 구성 → 토큰 임베딩. 입력이 [A, B, C]라면 타깃은 [B, C, D]입니다.',
    caution: '입력과 타깃의 길이는 같지만 시작 위치가 다릅니다. 토큰 ID 자체가 의미 벡터는 아니며, 임베딩을 거쳐야 모델이 계산할 벡터가 됩니다.',
  },
  'llm-03a': {
    concept: 'Attention은 현재 위치에서 어떤 토큰의 정보를 얼마나 참고할지 정합니다. Q는 찾는 정보, K는 비교할 정보, V는 실제로 섞어서 가져올 정보에 해당합니다.',
    flow: '입력에서 Q·K·V 투영 → Q와 K의 내적으로 점수 계산 → 차원 크기로 스케일 조정 → 미래 위치 마스킹 → softmax → 가중치와 V를 곱해 문맥 벡터 생성.',
    caution: '마스킹은 softmax 전에 적용합니다. 미래 토큰 점수를 매우 작은 값으로 만들어 확률을 0에 가깝게 하는 것이며, Q·K 점수 자체가 최종 문맥 벡터는 아닙니다.',
  },
  'llm-04': {
    concept: 'GPT는 토큰의 의미와 위치를 함께 받아 Transformer 블록을 통과시키고, 각 위치에서 다음 토큰의 점수를 출력합니다. Residual 연결은 블록 입력을 출력에 더해 정보와 기울기가 전달될 경로를 유지합니다.',
    flow: '토큰 임베딩 + 위치 임베딩 → 정규화·Attention·Residual → 정규화·FeedForward·Residual → 출력 헤드. 생성할 때는 마지막 위치의 점수에서 토큰을 선택하고 입력 뒤에 붙입니다.',
    caution: '출력 logits는 확률이 아니라 점수입니다. Greedy decoding은 가장 높은 점수의 토큰을 고르며, 생성 시 마지막 시점을 선택하는 것과 학습 시 모든 시점의 손실을 계산하는 것을 구분하세요.',
  },
  'llm-05': {
    concept: '사전학습은 다음 토큰 예측 오차를 줄이도록 모델 파라미터를 갱신하는 과정입니다. Cross entropy는 정답 토큰에 높은 점수를 주도록 유도합니다.',
    flow: '학습 모드 설정 → 배치 입력 → logits와 타깃으로 손실 계산 → 이전 기울기 초기화 → backward → optimizer.step. 생성·평가 때는 별도로 그래디언트 계산을 끕니다.',
    caution: 'backward는 기울기를 계산하고 step이 실제 가중치를 바꿉니다. zero_grad를 생략하면 기울기가 누적됩니다. eval만 호출한다고 그래디언트 계산이 꺼지지는 않습니다.',
  },
  'llm-06a': {
    concept: '분류 미세조정은 언어 모델의 표현을 이용해 문장의 클래스를 예측하도록 바꾸는 작업입니다. 분류 헤드는 어휘 수 대신 클래스 수만큼 점수를 출력합니다.',
    flow: '텍스트 토큰화 → 긴 입력 자르기·짧은 입력 패딩 → 정답 label 구성 → 기존 파라미터 동결 → 출력층 교체 → 선택한 층만 학습 → 분류 logits로 손실 계산.',
    caution: 'requires_grad=False는 해당 파라미터의 학습을 막는 설정입니다. 출력층 교체와 학습할 층 선택은 별개이며, 패딩 위치와 분류에 사용할 토큰 위치도 구분해야 합니다.',
  },
  'llm-06b': {
    concept: 'LoRA는 큰 기존 가중치를 직접 모두 학습하는 대신 작은 저랭크 행렬 A와 B로 가중치 변화량을 학습합니다. 원래 선형층의 결과에 작은 보정 경로의 결과를 더합니다.',
    flow: '기존 가중치 동결 → 대상 선형층 선택 → 저랭크 A·B 생성 또는 LoRA 설정 선언 → 기존 출력 + 스케일된 LoRA 출력 → 보정 파라미터 학습.',
    caution: 'rank는 저랭크 경로의 크기이지 클래스 수가 아닙니다. 직접 구현과 라이브러리 설정의 스케일 표기 방식은 다를 수 있으므로 alpha·rank 조합과 곱셈 순서는 해당 실습 코드를 그대로 기억하세요.',
  },
  'llm-07a': {
    concept: 'Instruction finetuning은 지시문과 응답으로 구성된 예제를 학습해 지시를 따르도록 만드는 과정입니다. 구분 토큰은 지시·입력·응답의 경계를 표현합니다.',
    flow: '지시·응답 형식 구성 → 토큰화 → 배치 길이 맞추기 → 입력과 타깃을 한 토큰 어긋나게 구성 → 학습하지 않을 패딩 타깃을 ignore 값으로 지정 → 다음 토큰 손실 계산.',
    caution: '패딩 토큰을 입력에 넣는 것과 패딩 위치를 손실에서 제외하는 것은 다른 작업입니다. 입력 전체를 지우는 것이 아니라 타깃의 해당 위치를 마스킹합니다.',
  },
  'llm-07b': {
    concept: 'DPO는 같은 prompt에 대한 선호 응답 chosen과 비선호 응답 rejected를 비교해 학습합니다. 학습 중인 policy가 기준 reference보다 선호 응답을 상대적으로 더 높게 평가하도록 유도합니다.',
    flow: '토크나이저·policy·reference 로드 → prompt/chosen/rejected 데이터 구성 → 응답 토큰의 로그확률 계산 → policy의 선호·비선호 차이와 reference의 차이 비교 → DPO 손실. LoRA와 함께 쓰면 policy의 보정 파라미터를 학습합니다.',
    caution: 'chosen과 rejected를 바꾸면 선호 방향이 뒤집힙니다. DPO는 선호 학습 목적이고 LoRA는 파라미터를 효율적으로 학습하는 방식이므로 둘은 대체 관계가 아닙니다.',
  },
  'rag-d1-01': {
    concept: 'RAG는 질문과 관련된 외부 문서를 검색해 답변의 근거로 제공하는 방식입니다. 인덱스는 검색할 자료를 조직하고, retriever는 질문에 맞는 자료를 가져옵니다.',
    flow: '문서 준비 → 인덱스 생성 → 인덱스에서 retriever 구성 → 질문으로 retrieve 호출 → 검색된 노드와 내용을 후속 프롬프트에 전달.',
    caution: '검색 결과는 최종 답변이 아닙니다. retriever가 가져온 자료를 읽고 답변을 생성하는 단계가 별도로 필요합니다.',
  },
  'rag-d2-02': {
    concept: '벡터 검색은 질문과 문서를 임베딩으로 표현한 뒤 유사한 문서를 찾습니다. prompt_generator는 검색 결과를 모델이 읽을 문맥으로 정리하고 사용자 질문과 연결하는 역할을 합니다.',
    flow: '벡터 인덱스 준비 → retriever로 top-k 검색 → 검색 결과에서 본문 추출 → 문맥과 질문으로 프롬프트 생성 → messages 구성 → Chat Completion 호출.',
    caution: 'top-k는 가져올 후보 수이지 정답의 개수가 아닙니다. 검색 객체를 그대로 문자열로 넘기는 것과 문서 본문을 추출해 프롬프트에 넣는 것을 구분하세요.',
  },
  'rag-d2-03': {
    concept: 'Knowledge graph는 개체와 관계를 연결해 지식을 표현합니다. 벡터 검색이 문맥의 유사성을 찾는다면 그래프 검색은 연결 관계를 활용합니다. 혼합 RAG는 두 경로의 결과를 답변 근거로 함께 사용합니다.',
    flow: '벡터 검색 경로와 KG 검색 경로 구성 → 같은 질문으로 각 경로 조회 → 반환된 텍스트·관계 정보 정리 → 통합 문맥 생성 → 질문과 함께 답변 생성 단계로 전달.',
    caution: 'KG query engine은 설정에 따라 검색 결과를 가공한 응답을 반환할 수 있습니다. 벡터 retriever와 반환 형식이 같다고 가정하지 말고 실습에서 각 결과를 꺼내는 코드를 확인하세요.',
  },
  'rag-d2-04': {
    concept: 'MCP는 모델을 사용하는 앱과 외부 도구·데이터 제공 측을 연결하는 인터페이스입니다. 에이전트는 연결된 도구의 설명을 보고 필요한 도구를 호출해 정보를 얻을 수 있습니다.',
    flow: 'MCP 클라이언트 관련 모듈 준비 → 서버 연결 → 사용 가능한 도구 조회 → 도구를 에이전트에 등록 → 질문 처리 과정에서 필요한 검색 도구 호출.',
    caution: 'MCP 자체가 벡터 검색 모델이나 인덱스는 아닙니다. 검색 기능을 제공하는 도구와 그 도구에 연결하는 통신 경로를 구분하세요.',
  },
  'data-ts': {
    concept: '시계열 예측은 시간 순서가 있는 과거 관측으로 미래 값을 추정합니다. Conv1D는 시간 구간의 패턴을, RNN은 순차적 상태를, encoder-decoder는 입력 시퀀스를 받아 출력 시퀀스를 만드는 구조를 표현합니다.',
    flow: '데이터 정규화·입력 구간 구성 → 모델과 배치를 같은 device로 이동 → forward → 정답과 손실 계산 → 기울기 초기화·역전파·갱신 → 평가 예측과 RMSE·MAPE 확인.',
    caution: '모델마다 배치·시간·특징 축의 순서가 다를 수 있습니다. 정규화 통계에 미래 평가 데이터가 섞이지 않게 해야 하며, MAPE는 정답이 0 또는 매우 작을 때 해석에 주의해야 합니다.',
  },
  'data-gcf': {
    concept: '그래프 협업 필터링은 사용자와 아이템의 상호작용을 그래프로 보고 이웃 정보를 모아 표현을 학습합니다. NGCF는 이웃의 표현뿐 아니라 사용자·아이템 표현의 상호작용도 메시지에 반영합니다.',
    flow: '사용자·아이템 초기 임베딩 → 연결 수 기반 정규화 → 이웃 메시지 계산·집계 → 자기 메시지와 결합 → 레이어별 표현 계산 → 여러 레이어 표현 결합 → 추천 점수 계산.',
    caution: 'degree 정규화는 이웃 수에 따른 메시지 크기 차이를 조정하고, 임베딩 벡터 정규화는 표현의 크기를 조정합니다. 두 정규화는 목적과 적용 대상이 다릅니다.',
  },
  'data-ncf': {
    concept: '신경망 협업 필터링은 사용자·아이템 ID를 임베딩으로 바꾸고 신경망으로 상호작용 점수를 학습합니다. 단순 내적보다 복잡한 관계를 표현할 수 있습니다.',
    flow: '데이터와 label 분리 → 클래스 비율을 고려한 split → 사용자·아이템 임베딩 조회 → 특징 결합 → 예측 점수 계산 → 평가 지표 확인.',
    caution: '임베딩 결합 시 배치 축이 아니라 특징 축을 사용해야 샘플별 사용자·아이템 정보가 함께 들어갑니다. stratified split은 클래스 비율을 맞추는 것이며 시간 순서를 보장하는 분할은 아닙니다.',
  },
  'vision-resnet': {
    concept: 'ResNet의 핵심은 변환한 특징에 입력을 더하는 residual 연결입니다. 작은 CIFAR 이미지에 맞춰 초기 convolution과 pooling을 조정하면 초반에 공간 정보가 과도하게 줄어드는 것을 피할 수 있습니다.',
    flow: '학습 이미지 증강 → CIFAR 크기에 맞는 stem과 pooling 설정 → 특징 추출 → 클래스 점수 → 최대 점수 클래스 선택 → 정답과 비교해 Top-1 accuracy 계산.',
    caution: '학습용 무작위 증강과 평가용 전처리는 구분합니다. Top-1 accuracy는 가장 높은 점수의 예측 하나가 정답인 비율이지 그 점수의 평균이 아닙니다.',
  },
  'vision-vit': {
    concept: 'ViT는 이미지를 패치 토큰으로 나눠 Transformer로 처리합니다. Q·K·V 기반 Attention으로 패치 간 관계를 계산하고, 분류용 CLS 토큰의 표현으로 이미지 클래스를 예측할 수 있습니다.',
    flow: '이미지 패치·임베딩 → CLS와 위치 정보 추가 → QKV 투영 → 스케일된 Q·K 점수와 softmax → V 가중합 → CLS 표현으로 분류 → confusion matrix 확인.',
    caution: 'CLS는 정답 label이 아니라 학습 가능한 분류용 토큰입니다. confusion matrix의 실제·예측 축 방향을 확인해야 어떤 클래스를 서로 혼동하는지 올바르게 읽을 수 있습니다.',
  },
  'vision-detr': {
    concept: 'DETR은 객체마다 클래스와 bounding box를 예측하는 객체 탐지 모델입니다. 분류와 달리 이미지 하나에 여러 객체의 위치·종류를 출력하며, 객체가 없는 query를 위한 no-object 클래스가 있습니다.',
    flow: '사전학습 모델에 맞게 이미지 정규화 → DETR 호출 → query별 클래스 점수·박스 획득 → no-object 제외 및 필요한 필터 적용 → 탐지 결과 해석.',
    caution: 'no-object를 일반 객체 클래스로 선택하지 않도록 해야 합니다. 박스 값은 좌표 형식과 정규화 여부를 확인한 뒤 이미지 크기에 맞춰 해석합니다.',
  },
  'vision-unet': {
    concept: 'U-Net은 픽셀마다 클래스를 예측하는 분할 모델입니다. encoder가 문맥 정보를 추출하고 decoder가 공간 해상도를 복원하며, skip connection이 같은 해상도의 세부 특징을 전달합니다.',
    flow: '이미지 인코딩 → 업샘플링 → encoder 특징과 채널 방향 결합 → 픽셀별 logits → 정답 mask와 손실 계산 → 확률 변환·threshold로 예측 mask 생성.',
    caution: 'U-Net의 특징 연결은 보통 concatenate이므로 ResNet의 더하기와 구분하세요. BCEWithLogitsLoss를 쓴다면 입력은 sigmoid 전 logits이고, threshold 적용은 예측 mask를 만들 때의 단계입니다.',
  },
  'vision-ddpm': {
    concept: 'DDPM은 원본 이미지에 점차 노이즈를 추가하는 과정과 이를 되돌리는 과정을 학습하는 확산 모델입니다. 노이즈 예측 방식에서는 현재 시점의 noisy image에서 섞인 노이즈를 예측합니다.',
    flow: '시점 t 선택 → 누적 스케줄 계수로 원본과 노이즈 혼합 → noisy sample과 t를 모델에 입력 → 노이즈 예측 학습. 생성은 노이즈에서 시작해 역방향 단계를 반복합니다.',
    caution: '한 단계의 alpha와 여러 단계의 누적 alpha를 혼동하지 마세요. noisy sample을 만드는 식과 역확산 갱신식은 역할이 다르며, 마지막 단계의 추가 노이즈 처리도 확인해야 합니다.',
  },
  'vision-sd': {
    concept: 'Stable Diffusion은 압축된 latent 공간에서 확산 과정을 수행합니다. Classifier-free guidance는 조건 없는 예측과 텍스트 조건이 있는 예측의 차이를 이용해 프롬프트의 영향을 조절합니다.',
    flow: '조건부·무조건부 텍스트 표현 준비 → 같은 시점 latent의 두 노이즈 예측 → 무조건부 예측 + guidance scale × 두 예측의 차이 → scheduler로 latent 갱신 → 이미지 디코딩.',
    caution: 'guidance scale은 학습률이 아닙니다. 값을 키운다고 화질이 항상 좋아지는 것은 아니며, 조건부와 무조건부 예측의 뺄셈 방향을 반대로 쓰지 않도록 주의하세요.',
  },
  'ondevice-cnn-pruning': {
    concept: 'Pruning은 중요도가 낮은 가중치를 0으로 만들어 희소하게 만드는 방법입니다. Magnitude pruning은 가중치 절댓값을 중요도로 사용하며, layer-wise는 층별로, global은 여러 층을 모아 기준을 정합니다.',
    flow: '목표 sparsity와 제거 개수 계산 → 절댓값 importance → threshold 결정 → 남길 원소의 mask → 가중치에 적용. 점진적 pruning은 학습 단계에 따라 목표 sparsity를 바꿉니다.',
    caution: 'mask의 1이 유지인지 제거인지 확인하세요. threshold와 같은 값이 여러 개면 비교 연산에 따라 실제 제거 수가 달라질 수 있고, 0이 늘어도 하드웨어 지원 없이 실행이 자동으로 빨라지지는 않습니다.',
  },
  'ondevice-cnn-quant': {
    concept: '양자화는 실수 값을 제한된 정수 범위로 표현하는 방법입니다. scale은 정수 한 칸에 대응하는 실수 간격이고 zero point는 실수 0에 대응하는 정수 위치입니다. codebook 양자화는 대표값 목록을 따로 사용합니다.',
    flow: '실수 범위로 scale·zero point 결정 → scale로 나누기 → rounding → zero point 반영 → 정수 범위로 제한. 연산 후에는 입력·가중치·출력 scale을 연결해 출력 정수 범위로 다시 변환합니다.',
    caution: '양자화와 복원의 방향을 구분하세요. 일반적인 affine 복원은 scale × (정수 − zero point)입니다. centroid 갱신은 선형 scale 계산이 아니라 codebook의 대표값을 갱신하는 별도 방식입니다.',
  },
  'ondevice-kd': {
    concept: 'Knowledge distillation은 큰 teacher의 예측이나 중간 특징을 작은 student가 따라 배우는 방식입니다. Soft target은 정답 클래스 외의 클래스 간 관계도 전달하고, 정답 label 손실은 실제 과제를 직접 지도합니다.',
    flow: 'teacher는 기울기 없이 출력 → student 출력 → temperature로 soft 분포 구성 → 분포 간 증류 손실 → 정답 label 손실과 가중 결합 → student만 갱신. 표현·feature map을 맞추는 변형도 있습니다.',
    caution: 'teacher 출력에는 학습용 그래디언트가 필요 없지만 student 경로는 유지해야 합니다. KL 손실의 log 확률·확률 입력 순서와 temperature 보정, 특징 크기 일치를 실습 코드에서 확인하세요.',
  },
  'ondevice-llm-pruning': {
    concept: 'LLM magnitude pruning은 가중치 크기로 중요도를 정하고, WANDA는 가중치 크기에 입력 activation의 크기를 함께 반영합니다. 작은 가중치라도 자주 크게 활성화되는 입력과 연결되면 중요할 수 있습니다.',
    flow: '가중치 shape·제거 개수 확인 → magnitude 또는 activation norm을 반영한 importance 계산 → 전체 또는 row별 threshold·순위 결정 → mask 생성 → 가중치 제거.',
    caution: 'row-wise pruning과 전체 threshold pruning은 제거 비율의 적용 단위가 다릅니다. activation norm이 가중치의 어떤 입력 채널과 대응하는지 확인해야 broadcasting이 의미에 맞습니다.',
  },
  'ondevice-llm-quant': {
    concept: 'LLM 양자화에서는 유난히 큰 outlier 채널이 양자화 범위를 넓혀 오차를 키울 수 있습니다. SmoothQuant는 activation과 weight 사이의 크기를 재분배하고, AWQ는 activation 정보를 활용해 가중치 양자화 오차를 줄이려 합니다. 회전은 값의 분포를 재배치하는 별도 변환입니다.',
    flow: '채널별 크기·outlier 확인 → 보정 scale 계산 → 인접 연산의 한쪽에는 scale, 다른 쪽에는 역scale 적용 → 대응하는 weight·bias 조정 → 양자화. 회전도 입력과 가중치에 대응 변환을 적용합니다.',
    caution: '한쪽만 scale하거나 회전하면 원래 계산이 달라집니다. LayerNorm bias까지 포함한 보정 방향과 입력·출력 차원을 구분하세요. 실수 연산에서의 대응 변환과 양자화 후 오차는 별개입니다.',
  },
};
