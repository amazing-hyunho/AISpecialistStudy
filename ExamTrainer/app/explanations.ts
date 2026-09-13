export type QuestionExplanation = {
  why: string;
  memory: string;
};

export const questionExplanations: Record<string, QuestionExplanation> = {
  'llm-001': {
    why: '입력 토큰 다음 위치부터 같은 길이만큼 잘라야 각 입력 토큰의 정답이 바로 다음 토큰이 됩니다.',
    memory: '입력이 0부터 시작하면 정답은 1부터 시작한다.',
  },
  'llm-002': {
    why: '언어 모델의 target 청크는 input 청크보다 한 칸 오른쪽으로 이동한 토큰 시퀀스여야 합니다.',
    memory: 'input은 i부터, target은 i+1부터 같은 길이로 자른다.',
  },
  'llm-003': {
    why: 'Query와 전치한 Key를 행렬 곱하면 모든 Query-Key 쌍의 내적 점수가 한 번에 계산됩니다.',
    memory: '어텐션 점수의 시작은 Q @ Kᵀ이다.',
  },
  'llm-004': {
    why: '미래 토큰의 점수를 음의 무한대로 바꾸면 softmax 결과가 0이 되어 해당 위치를 참조할 수 없습니다.',
    memory: '인과적 마스크는 미래 위치를 -inf로 막는다.',
  },
  'llm-005': {
    why: '토큰 의미를 담은 임베딩과 순서를 담은 위치 임베딩은 shape이 같아 원소별 덧셈으로 결합됩니다.',
    memory: 'GPT 입력은 token embedding + position embedding이다.',
  },
  'llm-006': {
    why: 'argmax는 어휘 차원의 logit 중 가장 큰 값의 token index를 고르며 keepdim은 다음 토큰 연결에 필요한 차원을 유지합니다.',
    memory: 'Greedy decoding은 argmax, 이어 붙일 때는 keepdim=True.',
  },
  'llm-007': {
    why: 'Cross entropy는 각 토큰의 어휘 logits와 정답 token id를 비교하므로 batch와 sequence 축을 하나로 펼칩니다.',
    memory: 'logits는 0,1축을 flatten하고 target도 1차원으로 펼친다.',
  },
  'llm-008': {
    why: 'backward를 호출하면 현재 loss에서 각 학습 파라미터까지의 gradient가 자동미분으로 계산됩니다.',
    memory: 'zero_grad → forward/loss → backward → step 순서.',
  },
  'llm-009': {
    why: 'LoRA의 A 행렬은 원래 입력 차원을 작은 rank 차원으로 투영해 학습 파라미터 수를 줄입니다.',
    memory: 'A shape은 in_dim × rank.',
  },
  'llm-010': {
    why: 'B 행렬은 rank 표현을 출력 차원으로 복원하며 0으로 초기화하면 학습 시작 시 LoRA 보정값이 0입니다.',
    memory: 'B shape은 rank × out_dim, 초기값은 zeros.',
  },
  'llm-011': {
    why: 'xAB가 저랭크 보정값이고 alpha/rank가 보정 크기를 안정적으로 조절하는 LoRA scaling입니다.',
    memory: 'LoRA 출력 보정은 alpha/rank × xAB.',
  },
  'llm-012': {
    why: '기존 모델 파라미터의 gradient 계산을 끄면 원본 가중치는 고정되고 추가된 LoRA 파라미터만 학습됩니다.',
    memory: '기본 가중치는 requires_grad=False.',
  },
  'llm-013': {
    why: '기존 Linear layer를 LoRA wrapper로 교체해야 forward 과정에 저랭크 보정 경로가 실제로 추가됩니다.',
    memory: '모델 생성 뒤 Linear를 LoRA로 교체하고 rank와 alpha를 전달한다.',
  },
  'llm-014': {
    why: 'DPO는 같은 prompt에 대해 사람이 선호한 응답의 확률을 비선호 응답보다 높이는 방식으로 학습합니다.',
    memory: 'chosen은 선호 응답이다.',
  },
  'llm-015': {
    why: 'rejected 응답은 선호도 비교에서 확률을 낮춰야 하는 음성 예시로 사용됩니다.',
    memory: 'rejected는 비선호 응답이다.',
  },
  'llm-016': {
    why: '선호·비선호 보상의 차이에 beta를 곱해 log-sigmoid를 취하고 음수로 바꾸면 최소화 가능한 DPO loss가 됩니다.',
    memory: 'DPO loss의 핵심 형태는 -logsigmoid(beta × preference logits).',
  },
  'llm-017': {
    why: 'rank는 LoRA가 사용할 저차원 병목의 크기로, 커질수록 표현력과 학습 파라미터가 함께 증가합니다.',
    memory: '강의 설정의 LoRA rank는 16.',
  },
  'llm-018': {
    why: 'alpha는 LoRA 보정값의 전체 크기를 조절하며 이 코드에서는 rank와 같아 alpha/rank가 1입니다.',
    memory: '강의 설정의 LoRA alpha는 16.',
  },
  'llm-019': {
    why: 'GPT-2 인코딩을 사용해야 데이터 token id가 GPT-2 계열 모델의 어휘 체계와 일치합니다.',
    memory: 'tiktoken.get_encoding에 gpt2를 전달한다.',
  },
  'llm-020': {
    why: 'Policy 모델은 학습과 응답 생성을 담당하므로 기준 설정과 동일한 GPT 구조로 먼저 생성합니다.',
    memory: 'Policy는 GPTModel(BASE_CONFIG)로 만든다.',
  },
  'llm-021': {
    why: 'SFT checkpoint의 state dict를 Policy 모델에 넣어야 DPO가 지도 미세조정된 상태에서 시작합니다.',
    memory: 'torch.load로 읽고 load_state_dict로 적용한다.',
  },
  'llm-022': {
    why: 'Reference 모델은 Policy와 같은 구조의 고정 기준 모델로, DPO가 원래 모델에서 과도하게 벗어나지 않도록 비교값을 제공합니다.',
    memory: 'Reference도 같은 BASE_CONFIG로 생성한다.',
  },
  'llm-023': {
    why: '각 dataset 항목을 동일한 prompt 형식으로 변환해야 chosen과 rejected의 조건부 확률을 같은 입력 기준에서 비교할 수 있습니다.',
    memory: 'prompt는 format_input(entry)로 표준화한다.',
  },
  'llm-024': {
    why: 'Preference dataset의 rejected 필드는 사람이 선택하지 않은 응답 문자열을 담고 있습니다.',
    memory: '비선호 응답은 entry["rejected"].',
  },
  'llm-025': {
    why: 'Preference dataset의 chosen 필드는 사람이 선택한 응답 문자열을 담고 있습니다.',
    memory: '선호 응답은 entry["chosen"].',
  },

  'rag-001': {
    why: '문서 목록을 전달하면 LlamaIndex가 문서를 node로 나누고 embedding을 만들어 vector index를 구성합니다.',
    memory: '문서에서 인덱스 생성은 VectorStoreIndex.from_documents.',
  },
  'rag-002': {
    why: 'Vector index를 retriever로 변환하면 질문과 가까운 node를 검색하는 공통 retrieve 인터페이스를 사용할 수 있습니다.',
    memory: 'index.as_retriever()로 검색기를 얻는다.',
  },
  'rag-003': {
    why: 'retrieve에 질문을 전달하면 embedding 유사도를 기준으로 관련 문서 조각이 반환됩니다.',
    memory: '검색 실행은 retriever.retrieve(query).',
  },
  'rag-004': {
    why: 'transformations에 parser를 넣으면 원문을 지정한 규칙으로 chunking한 뒤 각 chunk가 vector index에 저장됩니다.',
    memory: 'from_documents의 transformations에 parser를 전달한다.',
  },
  'rag-005': {
    why: 'similarity_top_k는 질문과 가장 유사한 문서 조각을 몇 개 반환할지 제한합니다.',
    memory: 'Top-k는 as_retriever(similarity_top_k=topk).',
  },
  'rag-006': {
    why: '검색 결과를 최대 길이까지만 잘라 prompt가 모델의 context 한도와 애플리케이션 제한을 넘지 않게 합니다.',
    memory: '긴 reference는 [:MAX_CONTEXT_REFERENCES_LENGTH]로 제한한다.',
  },
  'rag-007': {
    why: '검색 chunk를 enumerate하면 내용과 함께 번호를 붙여 prompt의 reference를 구분하고 추적할 수 있습니다.',
    memory: 'chunk 순회는 enumerate(top_k_chunks).',
  },
  'rag-008': {
    why: 'system role 메시지는 검색 근거를 사용하는 방식과 답변 규칙을 사용자 질문보다 높은 우선순위로 전달합니다.',
    memory: 'system prompt는 role=system, content=system_prompt.',
  },
  'rag-009': {
    why: '검색 근거로 구성한 messages를 Chat Completions 호출에 넘겨야 최종 답변 생성 단계가 실행됩니다.',
    memory: '검색 후 생성은 client.chat.completions.create 호출.',
  },
  'rag-010': {
    why: '자연어 질문에서 만든 graph query를 KG 검색 함수에 전달하면 구조화된 관계 기반 결과를 얻을 수 있습니다.',
    memory: '생성된 query는 get_finance_kg_results로 보낸다.',
  },
  'rag-011': {
    why: 'KG 결과를 리스트 형태의 reference로 Reader에 전달하면 질문과 구조화 지식을 함께 사용해 응답을 만듭니다.',
    memory: 'Reader 입력은 query와 [kg_results].',
  },
  'rag-012': {
    why: '그래프 질의가 적합한 분기에서는 KG 결과 하나를 공통 reference 목록 형태로 감싸 후속 생성기에 전달합니다.',
    memory: 'KG 전용 결과도 combined_results = [kg_results]로 리스트화한다.',
  },
  'rag-013': {
    why: '그래프 질의가 아닌 경우에는 vector retriever가 반환한 문서 결과를 그대로 공통 생성 경로에 사용합니다.',
    memory: '일반 검색 분기는 combined_results = retrieved_results.',
  },
  'rag-014': {
    why: 'BasicMCPClient는 MCP 서버 연결을, McpToolSpec은 서버 도구를 LlamaIndex agent용 도구로 변환하는 역할을 합니다.',
    memory: 'MCP 연동에는 BasicMCPClient와 McpToolSpec을 함께 import한다.',
  },
  'rag-015': {
    why: '외부 MCP 서버의 SSE 주소를 client에 전달해야 해당 서버와 지속적인 이벤트 기반 통신을 시작할 수 있습니다.',
    memory: '연결 객체는 BasicMCPClient(server_url).',
  },
  'rag-016': {
    why: 'MCP 서버의 도구 목록 조회는 네트워크 작업이므로 비동기 메서드를 await해 실제 agent 도구 목록을 얻습니다.',
    memory: '도구 변환은 await to_tool_list_async().',
  },
  'rag-017': {
    why: 'FunctionAgent에 LLM과 MCP tools를 연결하면 모델이 질문에 따라 적절한 외부 함수를 선택해 호출할 수 있습니다.',
    memory: 'MCP 도구 실행 주체는 FunctionAgent.',
  },
  'rag-018': {
    why: '시간 조건까지 포함한 full_query를 MCP 애플리케이션에 전달하고 await해야 외부 조회 결과를 비동기로 받을 수 있습니다.',
    memory: '최종 MCP 질의는 await application.query(full_query).',
  },

  'data-001': {
    why: '모델과 입력·정답 tensor가 같은 device에 있어야 연산이 가능하고 불필요한 장치 간 복사가 생기지 않습니다.',
    memory: 'batch_x와 batch_y를 함께 device로 이동한다.',
  },
  'data-002': {
    why: '시퀀스 모델 출력에서 마지막 시점과 첫 출력 채널을 선택하면 각 batch의 최종 예측값만 남습니다.',
    memory: '시계열 최종값은 [:, -1, 0].',
  },
  'data-003': {
    why: '선택한 loss 함수에 모델 예측과 정답을 전달해 학습이 최소화할 스칼라 오차를 계산합니다.',
    memory: 'loss_fn의 인자 순서는 pred, target.',
  },
  'data-004': {
    why: 'PyTorch gradient는 기본적으로 누적되므로 매 step 전에 이전 gradient를 0으로 초기화해야 합니다.',
    memory: 'backward 전에 optimizer.zero_grad().',
  },
  'data-005': {
    why: 'loss.backward는 계산 그래프를 역으로 따라가 모델 파라미터별 gradient를 채웁니다.',
    memory: '손실 계산 다음은 loss.backward().',
  },
  'data-006': {
    why: 'optimizer.step은 현재 저장된 gradient와 optimizer 규칙을 사용해 모델 가중치를 실제로 변경합니다.',
    memory: 'backward로 gradient를 만든 뒤 step으로 갱신한다.',
  },
  'data-007': {
    why: 'RMSE는 평균 제곱 오차에 제곱근을 취해 원래 target과 같은 단위로 오차를 표현하며 큰 오차에 민감합니다.',
    memory: 'RMSE 함수에는 y_true와 y_pred를 전달한다.',
  },
  'data-008': {
    why: 'MAPE는 실제값 대비 절대 오차 비율을 평균내 데이터 크기와 무관한 상대 오차를 보여줍니다.',
    memory: 'MAPE도 y_true, y_pred 순서이며 실제값 0에 주의한다.',
  },
  'data-009': {
    why: 'batch_first=True를 사용하면 RNN 입력과 출력 shape을 batch, sequence, feature 순서로 다룰 수 있습니다.',
    memory: 'RNN 선언에는 input_size, hidden_size, num_layers, batch_first=True.',
  },
  'data-010': {
    why: '출발·도착 node degree의 곱에 제곱근을 취한 역수는 연결 수가 많은 node의 영향이 과도해지는 것을 줄입니다.',
    memory: '대칭 degree 정규화는 1/sqrt(deg[src]×deg[dst]).',
  },
  'data-011': {
    why: 'NGCF message는 source feature의 선형 변환과 source·destination 간 원소별 상호작용을 더해 협업 신호를 표현합니다.',
    memory: 'W1(src) + W2(src*dst) 형태.',
  },
  'data-012': {
    why: 'index_add_는 같은 destination을 가진 edge message를 해당 node 위치에 누적해 이웃 정보를 집계합니다.',
    memory: 'destination index로 aggregated_messages에 index_add_.',
  },
  'data-013': {
    why: '각 NGCF layer는 graph 연결 정보와 현재 node feature, 사용자·아이템 경계를 받아 다음 전파 표현을 만듭니다.',
    memory: 'layer 호출에는 edge_index와 node_features, 사용자·아이템 수가 들어간다.',
  },
  'data-014': {
    why: '각 layer 출력을 feature 차원으로 연결하면 0-hop부터 여러 hop까지의 협업 정보를 최종 embedding에 함께 보존합니다.',
    memory: 'layer_outputs는 마지막 차원 dim=-1로 concat.',
  },
  'data-015': {
    why: 'fit_transform은 학습 데이터에서 최솟값과 최댓값을 학습하면서 동시에 정규화하며, 평가 데이터에는 이 범위를 그대로 재사용해야 정보 누출을 막을 수 있습니다.',
    memory: 'train은 fit_transform, test는 transform만 사용한다.',
  },
  'data-016': {
    why: 'stratify에 평점을 지정하면 학습·평가 세트의 평점 분포가 원본과 비슷하게 유지되어 평가 편향을 줄일 수 있습니다.',
    memory: '분류형 target 분포를 유지하려면 train_test_split의 stratify에 target을 전달한다.',
  },
  'data-017': {
    why: '사용자 embedding과 영화 embedding을 feature 축으로 연결하면 MLP가 두 표현의 조합으로 평점을 예측할 수 있습니다.',
    memory: 'embedding 결합은 dim=1.',
  },
  'data-018': {
    why: 'MSE는 실제 평점과 예측 평점 차이의 제곱 평균으로, 추천 모델의 수치 예측 오차를 측정합니다.',
    memory: 'mean_squared_error(y_true, y_pred) 순서.',
  },

  'vision-001': {
    why: '이미지 주변에 4픽셀을 채운 뒤 32×32를 무작위로 자르면 작은 평행이동 변형이 생겨 일반화가 좋아집니다.',
    memory: 'CIFAR augmentation은 RandomCrop(32, padding=4).',
  },
  'vision-002': {
    why: '3×3 kernel, stride 1, padding 1은 32×32 입력 해상도를 유지해 작은 CIFAR 이미지가 초기에 지나치게 축소되지 않게 합니다.',
    memory: 'CIFAR용 ResNet stem은 3→64, kernel 3, stride 1, padding 1.',
  },
  'vision-003': {
    why: 'ImageNet용 초기 maxpool을 Identity로 바꾸면 연산 흐름은 유지하면서 작은 입력의 공간 해상도 축소를 제거합니다.',
    memory: 'layer 제거가 필요할 때 nn.Identity()로 대체한다.',
  },
  'vision-004': {
    why: '하나의 Linear layer가 inner_dim의 3배를 출력하면 결과를 세 조각으로 나눠 Q, K, V를 효율적으로 만들 수 있습니다.',
    memory: 'QKV projection의 출력 크기는 inner_dim × 3.',
  },
  'vision-005': {
    why: 'einsum으로 각 head의 Q와 K 내적을 계산하고 sqrt 차원에 해당하는 scale을 곱해 softmax 포화를 완화합니다.',
    memory: 'attention score는 QKᵀ × scale.',
  },
  'vision-006': {
    why: 'CLS 토큰을 patch 토큰 앞에 붙이면 Transformer가 전체 이미지 정보를 CLS 위치에 모아 분류에 사용할 수 있습니다.',
    memory: 'torch.cat의 순서는 (cls_tokens, patch_tokens), dim=1.',
  },
  'vision-007': {
    why: 'ImageNet으로 사전학습된 backbone은 같은 평균과 표준편차로 입력을 정규화해야 학습 때의 입력 분포와 맞습니다.',
    memory: 'ImageNet mean은 0.485/0.456/0.406, std는 0.229/0.224/0.225.',
  },
  'vision-008': {
    why: 'torch.hub.load에 공식 저장소와 detr_resnet50, pretrained=True를 주면 학습된 DETR 가중치까지 불러옵니다.',
    memory: 'DETR 로드는 repository, model name, pretrained=True.',
  },
  'vision-009': {
    why: '마지막 class는 객체가 없음을 뜻하므로 softmax 후 :-1로 제외해야 실제 객체 class confidence만 비교할 수 있습니다.',
    memory: 'DETR 분류 확률은 softmax(-1) 후 마지막 no-object 제거.',
  },
  'vision-010': {
    why: 'decoder의 업샘플 feature와 encoder의 고해상도 feature를 채널 축으로 연결해 위치 정보를 복원합니다.',
    memory: 'U-Net skip connection은 torch.cat([skip, up], dim=1).',
  },
  'vision-011': {
    why: 'BCEWithLogitsLoss는 sigmoid와 binary cross entropy를 수치적으로 안정된 한 연산으로 결합합니다.',
    memory: '이진 segmentation 학습에는 raw logits와 BCEWithLogitsLoss.',
  },
  'vision-012': {
    why: 'sigmoid 결과는 확률이므로 0.5보다 큰 픽셀을 1, 나머지를 0으로 바꿔 최종 binary mask를 만듭니다.',
    memory: '확률 → mask는 (probs > 0.5).float().',
  },
  'vision-013': {
    why: '누적 alpha의 제곱근으로 원본과 Gaussian noise를 가중합하면 중간 단계를 반복하지 않고 임의 시점 xₜ를 직접 샘플링할 수 있습니다.',
    memory: 'xₜ = sqrt(alpha_bar)×x₀ + sqrt(1-alpha_bar)×noise.',
  },
  'vision-014': {
    why: '학습 때 q_sample에 실제 생성한 noise를 넘기면 모델이 예측해야 할 정답 noise와 xₜ 생성에 사용한 noise가 정확히 일치합니다.',
    memory: 'DDPM 학습은 같은 noise로 x_noisy를 만들고 그 noise를 예측한다.',
  },
  'vision-015': {
    why: '역확산 평균 계산에서 모델이 추정한 noise 성분을 beta와 누적 alpha 계수에 맞춰 현재 이미지에서 제거합니다.',
    memory: 'reverse step의 핵심은 x에서 scaled predicted noise를 뺀다.',
  },
  'vision-016': {
    why: '가장 큰 logit의 class index와 정답을 비교한 boolean tensor를 float로 바꿔 평균내면 batch의 Top-1 Accuracy가 됩니다.',
    memory: 'Top-1 Accuracy는 (argmax 예측 == target)의 float 평균.',
  },
  'vision-017': {
    why: 'guidance scale은 무조건·조건부 예측 차이를 얼마나 강하게 반영할지 정하며 값이 높을수록 prompt를 더 강하게 따릅니다.',
    memory: '강의 설정의 guidance_scale은 7.5.',
  },
  'vision-018': {
    why: 'confusion matrix는 실제 class를 행, 예측 class를 열로 집계해 어떤 class 쌍에서 오분류가 발생하는지 보여줍니다.',
    memory: 'confusion_matrix의 인자 순서는 y_true인 all_labels, y_pred인 all_preds.',
  },

  'ondevice-001': {
    why: '전체 가중치 개수에 목표 sparsity를 곱하고 반올림하면 0으로 만들 원소 수가 정해집니다.',
    memory: 'pruned count = round(numel × sparsity).',
  },
  'ondevice-002': {
    why: '절댓값 importance의 k번째 작은 값을 threshold로 잡으면 목표 개수만큼 작은 가중치를 제거할 수 있습니다.',
    memory: 'magnitude threshold는 kthvalue(flattened importance, num_pruned).',
  },
  'ondevice-003': {
    why: 'threshold보다 큰 가중치만 True로 남긴 mask를 곱하면 중요도가 낮은 가중치가 0이 됩니다.',
    memory: '유지 조건은 importance > threshold.',
  },
  'ondevice-004': {
    why: '실수 값을 scale로 나누면 quantized integer grid의 좌표로 변환되며 이후 round와 zero point 이동이 이어집니다.',
    memory: '양자화 첫 단계는 fp_tensor / scale.',
  },
  'ondevice-005': {
    why: '실수 범위 폭을 표현 가능한 정수 범위 폭으로 나누면 정수 한 칸이 나타내는 실수 간격인 scale이 됩니다.',
    memory: 'scale = float range / quantized range.',
  },
  'ondevice-006': {
    why: 'zero point는 실수 0이 정수 범위의 어느 값에 대응하는지 이동량을 정하며 정수로 반올림해야 합니다.',
    memory: 'zero_point = round(qmin - fp_min/scale).',
  },
  'ondevice-007': {
    why: '정수 누적 결과에 input scale과 weight scale을 곱하고 output scale로 나누면 목표 출력 양자화 단위로 변환됩니다.',
    memory: 'requantization 비율은 input_scale × weight_scale / output_scale.',
  },
  'ondevice-008': {
    why: 'Teacher는 지식을 제공하는 고정 모델이므로 no_grad 영역에서 forward해 gradient와 메모리 사용을 막습니다.',
    memory: 'Teacher는 eval + no_grad, Student만 학습.',
  },
  'ondevice-009': {
    why: 'Teacher logits를 temperature T로 나눈 뒤 softmax하면 class 간 관계가 드러나는 부드러운 target 분포가 됩니다.',
    memory: 'soft target = softmax(teacher_logits / T).',
  },
  'ondevice-010': {
    why: 'Teacher와 Student 확률분포 차이를 KL divergence 형태로 계산하고 T²를 곱해 temperature로 작아진 gradient 크기를 보정합니다.',
    memory: 'soft loss에는 분포 차이와 T**2 보정이 함께 들어간다.',
  },
  'ondevice-011': {
    why: 'Teacher 지식의 soft-target loss와 실제 정답의 cross-entropy를 가중합해 모방과 정답 학습을 동시에 수행합니다.',
    memory: '최종 KD loss = soft weight×soft loss + CE weight×label loss.',
  },
  'ondevice-012': {
    why: '입력 채널별 L2 norm 제곱은 calibration 데이터에서 각 채널 activation의 전체 크기를 측정합니다.',
    memory: 'activation importance는 norm(x, p=2, dim=1) ** 2.',
  },
  'ondevice-013': {
    why: 'WANDA는 가중치 절댓값에 해당 입력 채널의 activation 크기를 곱해 실제 출력 영향도를 importance로 사용합니다.',
    memory: 'WANDA importance = |W| × input feature norm.',
  },
  'ondevice-014': {
    why: '행별 threshold를 열 방향으로 broadcast해 각 output neuron마다 같은 sparsity 비율의 가중치를 유지합니다.',
    memory: 'row threshold shape을 (row, 1)로 바꿔 비교한다.',
  },
  'ondevice-015': {
    why: 'importance가 큰 상위 1% 채널 index를 골라 양자화 오차에 민감한 outlier 채널을 별도로 다룹니다.',
    memory: '중요 채널 선택은 topk(...)[1]의 index.',
  },
  'ondevice-016': {
    why: '양자화 전에 확대했던 중요 채널을 같은 scale factor로 나누면 모델의 원래 함수 크기를 유지하면서 양자화 효과만 남습니다.',
    memory: 'scale up 후 quantize, 마지막에는 같은 factor로 divide.',
  },
  'ondevice-017': {
    why: 'activation scale은 alpha만큼, weight scale은 1-alpha만큼 반대로 적용해 두 tensor의 outlier 부담을 균형 있게 재분배합니다.',
    memory: 'SmoothQuant scale = act^alpha / weight^(1-alpha).',
  },
  'vision-019': {
    why: 'RandomHorizontalFlip은 학습 이미지를 확률적으로 좌우 반전해 위치 변화에 대한 다양한 예제를 만듭니다. 이 실습의 평가 전처리에는 무작위 증강을 넣지 않아 같은 입력을 일관되게 평가합니다.',
    memory: '학습에는 무작위 반전, 평가에는 Tensor 변환과 정규화만.',
  },
  'vision-020': {
    why: '이 CIFAR-10 실습의 PIL 이미지는 ToTensor를 거쳐 (C, H, W) 형태의 실수 Tensor가 되고 픽셀값은 0~1로 변환됩니다. 그다음 Normalize가 채널별 평균과 표준편차를 적용합니다.',
    memory: 'PIL → ToTensor → Normalize. 배치가 되면 (B, C, H, W).',
  },
  'vision-021': {
    why: '평가에서도 학습 때와 같은 평균·표준편차를 사용해야 모델이 기대하는 입력 분포에 맞습니다. 무작위 crop·flip은 생략하지만 정규화까지 생략하는 것은 아닙니다.',
    memory: '평가: 증강은 빼고, 학습과 같은 Normalize는 유지.',
  },
  'vision-022': {
    why: 'DataLoader는 Dataset 샘플을 batch_size만큼 묶고 shuffle=True로 학습 샘플 순서를 섞습니다. num_workers는 데이터 로딩 작업 수, pin_memory는 호스트 메모리 설정이며 GPU 이동 자체를 수행하지는 않습니다.',
    memory: '학습 loader는 train_set + shuffle=True. GPU 이동은 별도 .to(device).',
  },
  'vision-023': {
    why: 'Rearrange로 펼친 각 패치는 채널 수×패치 높이×패치 너비 길이의 벡터입니다. Linear는 이 patch_dim을 Transformer가 사용하는 cfg.dim으로 투영하고 패치 개수 축은 유지합니다.',
    memory: '(B, N, patch_dim) → Linear → (B, N, cfg.dim).',
  },
  'vision-024': {
    why: 'Attention으로 토큰 간 정보를 섞은 결과에 원래 입력을 더해 잔차 경로를 만듭니다. 두 Tensor의 형태가 같아야 하며, U-Net에서 채널 수를 늘리는 concat과는 다릅니다.',
    memory: 'Residual은 attn(x) + x. concat이 아니다.',
  },
  'vision-025': {
    why: '이 실습은 NLL 손실을 사용하므로 모델의 raw logits를 log_softmax로 로그확률로 바꿉니다. dim=1은 (B, C) 출력의 클래스 축입니다. 일반 softmax만 적용한 확률은 NLL의 입력 형식과 다릅니다.',
    memory: 'NLL 앞에는 log_softmax, 클래스 축은 dim=1.',
  },
  'vision-026': {
    why: 'nll_loss는 각 샘플의 정답 클래스 인덱스로 해당 로그확률을 선택해 음의 로그우도를 계산합니다. 정답 클래스의 확률이 높아질수록 손실이 작아집니다. output은 로그확률이고 target은 클래스 인덱스입니다.',
    memory: 'log_softmax 출력 + 정답 인덱스 → nll_loss.',
  },
  'vision-027': {
    why: 'backward는 손실에서 학습 파라미터까지 기울기를 계산하고 optimizer.step은 그 기울기로 파라미터를 갱신합니다. 앞의 zero_grad는 이전 배치의 기울기를 초기화합니다.',
    memory: 'zero_grad → forward·loss → backward → step.',
  },
  'vision-028': {
    why: '이진 분할의 정답은 이미지 하나당 숫자 하나가 아니라 픽셀별 mask입니다. (H, W)에 채널 축을 추가하면 (1, H, W), 배치로 묶으면 (B, 1, H, W)가 되어 모델 출력과 맞습니다.',
    memory: '분류 정답은 클래스 인덱스, 분할 정답은 채널이 있는 픽셀 mask.',
  },
  'vision-029': {
    why: 'criterion은 앞 셀에서 선언한 BCEWithLogitsLoss입니다. sigmoid 전의 픽셀 logits와 같은 형태의 실수 mask를 비교해 학습 손실을 만듭니다. threshold로 이진화한 예측은 학습 손실에 넣지 않습니다.',
    memory: '학습은 logits + masks. sigmoid·0.5 threshold는 예측 시각화 단계.',
  },
  'vision-030': {
    why: '노이즈 제거 모델은 noisy image뿐 아니라 현재 시점 t도 받아야 어느 정도 노이즈가 섞였는지 조건으로 사용할 수 있습니다. 이 실습의 모델 출력은 원본 이미지가 아니라 주입된 노이즈의 예측입니다.',
    memory: 'denoise_model(x_noisy, t) → predicted_noise.',
  },
  'vision-031': {
    why: 'L2 분기의 정답은 q_sample에 실제로 주입한 noise이고 모델 출력은 predicted_noise입니다. 두 값의 평균제곱오차를 줄이며 노이즈 예측을 학습합니다. 실습에는 L1·Huber 분기도 있으므로 L2에 해당하는 함수를 구분하세요.',
    memory: '확산 모델의 L2 정답 연결: 실제 noise ↔ predicted_noise.',
  },
  'vision-032': {
    why: 'logits의 각 행은 이미지 하나의 클래스별 점수입니다. argmax(dim=1)은 각 이미지에서 점수가 가장 큰 클래스 인덱스를 반환합니다. softmax는 점수 순서를 유지하므로 Top-1 선택만 할 때 필수는 아닙니다.',
    memory: '(B, C) → argmax(dim=1) → (B,) 예측 인덱스.',
  },
  'vision-033': {
    why: 'pred.eq(target)은 샘플별 정답 여부를 Boolean으로 만들고 sum은 True 개수를 셉니다. item과 int는 그 값을 누적 가능한 Python 정수로 꺼냅니다. 배치별 정확도 대신 정답 개수를 누적합니다.',
    memory: '예측 == 정답 → sum → 배치 정답 수.',
  },
  'vision-034': {
    why: '전체 정답 수를 전체 샘플 수로 나누면 마지막 배치 크기가 작아도 각 샘플에 같은 비중을 주는 정확도가 됩니다. 크기가 다른 배치들의 정확도를 단순 평균하면 결과가 달라질 수 있습니다.',
    memory: '전체 accuracy = 모든 배치의 정답 수 합 / 전체 샘플 수.',
  },
  'ondevice-018': {
    why: 'LayerNorm 파라미터를 scale로 나누고 다음 FC weight를 같은 scale로 곱하면 전체 출력은 유지하면서 내부 분포만 평탄해집니다.',
    memory: 'LN은 divide, 연결된 FC는 multiply.',
  },
};
