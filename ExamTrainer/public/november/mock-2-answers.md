# 11월 대비 2회 — 다음 후보 — 정답·해설

빈칸당 4점, 과목당 20점, 총 100점. 미작성은 0점. 아래는 예시 답안이며 같은 shape와 동작의 동등한 구현도 정답으로 인정합니다. API 이름만 묻는 빈칸은 해당 위치에 들어갈 부분만 작성합니다. 다중 줄은 필요한 동작을 모두 충족하면 4점으로 채점하세요.

## 1번 · LLM — 자동회귀 시프트

```python
labels[:, 1:]
```

레이블을 한 칸 앞당겨 logits와 정렬하세요.

출처: LLM/Chapter_7_Exercise_Follow_Instructions_dpo.ipynb · 셀 0

## 2번 · LLM — 정답 로그확률

```python
torch.gather
```

정답 레이블 위치의 log probability를 모으세요.

출처: LLM/Chapter_7_Exercise_Follow_Instructions_dpo.ipynb · 셀 0

## 3번 · LLM — DPO Loss

```python
F.logsigmoid
```

선호·비선호 보상의 차이에 beta를 곱해 log-sigmoid를 취하고 음수로 바꾸면 최소화 가능한 DPO loss가 됩니다.

출처: LLM/Chapter_7_Exercise_Follow_Instructions_dpo.ipynb · 셀 0

## 4번 · LLM — LoRA A

```python
torch.empty(in_dim, rank)
```

LoRA의 A 행렬은 원래 입력 차원을 작은 rank 차원으로 투영해 학습 파라미터 수를 줄입니다.

출처: llm_from_scratch/Chapter_6_Finetuning_for_Text_Classification_LoRA_KR.ipynb · 셀 29

## 5번 · LLM — LoRA B

```python
torch.zeros(rank, out_dim)
```

B 행렬은 rank 표현을 출력 차원으로 복원하며 0으로 초기화하면 학습 시작 시 LoRA 보정값이 0입니다.

출처: llm_from_scratch/Chapter_6_Finetuning_for_Text_Classification_LoRA_KR.ipynb · 셀 29

## 6번 · RAG — MCP 연결

```python
BasicMCPClient(external_mcp_server)
```

외부 MCP 서버의 SSE 주소를 client에 전달해야 해당 서버와 지속적인 이벤트 기반 통신을 시작할 수 있습니다.

출처: 4_RAG_framework_evaluation_with_MCP.ipynb · 셀 42

## 7번 · RAG — MCP 도구 어댑터

```python
McpToolSpec(client=mcp_client)
```

BasicMCPClient가 서버 연결을 담당한다면 McpToolSpec은 그 클라이언트의 도구를 LlamaIndex에서 사용할 수 있게 연결합니다. 다음 to_tool_list_async 호출로 가져온 도구 목록을 FunctionAgent의 tools에 전달합니다.

출처: 4_RAG_framework_evaluation_with_MCP.ipynb · 셀 42

## 8번 · RAG — 도구 조회

```python
await mcp_tool.to_tool_list_async()
```

MCP 서버의 도구 목록 조회는 네트워크 작업이므로 비동기 메서드를 await해 실제 agent 도구 목록을 얻습니다.

출처: 4_RAG_framework_evaluation_with_MCP.ipynb · 셀 42

## 9번 · RAG — Agent 생성

```python
FunctionAgent
```

FunctionAgent에 LLM과 MCP tools를 연결하면 모델이 질문에 따라 적절한 외부 함수를 선택해 호출할 수 있습니다.

출처: 4_RAG_framework_evaluation_with_MCP.ipynb · 셀 46

## 10번 · RAG — Agent 실행 문맥

```python
Context(self.agent)
```

Context(self.agent)는 이 Agent workflow의 실행 상태를 관리할 context를 만듭니다. query에서 같은 context를 run에 전달합니다. 검색 문서 본문을 뜻하는 RAG context와 workflow 상태 객체는 서로 다른 개념입니다.

출처: 4_RAG_framework_evaluation_with_MCP.ipynb · 셀 46

## 11번 · Data — Message Passing

```python
self.W2
```

NGCF message는 source feature의 선형 변환과 source·destination 간 원소별 상호작용을 더해 협업 신호를 표현합니다.

출처: RecSys_GCF_sol.ipynb · 셀 13

## 12번 · Data — Message 집계

```python
aggregated_messages.index_add_(0, dst, edge_messages_for_dst)
```

index_add_는 같은 destination을 가진 edge message를 해당 node 위치에 누적해 이웃 정보를 집계합니다.

출처: RecSys_GCF_sol.ipynb · 셀 13

## 13번 · Data — Layer 결합

```python
torch.concat(layer_outputs,dim=-1)
```

각 layer 출력을 feature 차원으로 연결하면 0-hop부터 여러 hop까지의 협업 정보를 최종 embedding에 함께 보존합니다.

출처: RecSys_GCF_sol.ipynb · 셀 14

## 14번 · Data — Embedding 결합

```python
torch.cat([user_embedding, movie_embedding], dim = 1)
```

사용자 embedding과 영화 embedding을 feature 축으로 연결하면 MLP가 두 표현의 조합으로 평점을 예측할 수 있습니다.

출처: RecSys_NCF.ipynb · 셀 10

## 15번 · Data — 평가 Metric

```python
mean_squared_error
```

MSE는 실제 평점과 예측 평점 차이의 제곱 평균으로, 추천 모델의 수치 예측 오차를 측정합니다.

출처: RecSys_NCF.ipynb · 셀 18

## 16번 · Vision — Data Augmentation

```python
T.RandomCrop(32, padding=4)
```

이미지 주변에 4픽셀을 채운 뒤 32×32를 무작위로 자르면 작은 평행이동 변형이 생겨 일반화가 좋아집니다.

출처: 01_ResNet18_CIFAR10.ipynb · 셀 5

## 17번 · Vision — 학습 이미지 정규화

```python
T.Normalize(CIFAR10_MEAN, CIFAR10_STD)
```

각 채널에서 평균을 빼고 표준편차로 나눕니다. 학습·평가에 같은 통계를 사용하되 무작위 증강은 학습 쪽에 둡니다.

출처: 01_ResNet18_CIFAR10.ipynb · 셀 5

## 18번 · Vision — CIFAR Stem

```python
nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False)
```

3×3 kernel, stride 1, padding 1은 32×32 입력 해상도를 유지해 작은 CIFAR 이미지가 초기에 지나치게 축소되지 않게 합니다.

출처: 01_ResNet18_CIFAR10.ipynb · 셀 8

## 19번 · Vision — MaxPool 제거

```python
nn.Identity()
```

ImageNet용 초기 maxpool을 Identity로 바꾸면 연산 흐름은 유지하면서 작은 입력의 공간 해상도 축소를 제거합니다.

출처: 01_ResNet18_CIFAR10.ipynb · 셀 8

## 20번 · Vision — 예측 클래스 선택

```python
logits.argmax(dim=1)
```

logits의 각 행은 이미지 하나의 클래스별 점수입니다. argmax(dim=1)은 각 이미지에서 점수가 가장 큰 클래스 인덱스를 반환합니다. softmax는 점수 순서를 유지하므로 Top-1 선택만 할 때 필수는 아닙니다.

출처: 01_ResNet18_CIFAR10.ipynb · 셀 10

## 21번 · On-device — Linear Quantization

```python
torch.round
```

scale된 부동소수 tensor를 정수값으로 rounding하세요.

출처: 2. Quantization for CNN_answer.ipynb · 셀 24

## 22번 · On-device — Zero Point

```python
round
```

zero point는 실수 0이 정수 범위의 어느 값에 대응하는지 이동량을 정하며 정수로 반올림해야 합니다.

출처: 2. Quantization for CNN_answer.ipynb · 셀 33

## 23번 · On-device — 채널별 scale broadcast

```python
weight_scale = weight_scale.flatten().view(1, -1, 1, 1)
output = output.float()
```

배치와 공간 축에 동일한 채널 scale을 broadcast합니다. float scale 곱을 위해 누적값을 변환합니다.

출처: On-Device/실습/2. Quantization for CNN_answer.ipynb · 셀 64

## 24번 · On-device — CNN 반올림·범위 제한

```python
output = output.round().clamp(*get_quantized_range(feature_bitwidth)).to(torch.int8)
```

범위 제한을 dtype 변환보다 먼저 적용합니다. signed int8은 -128부터 127까지입니다.

출처: On-Device/실습/2. Quantization for CNN_answer.ipynb · 셀 64

## 25번 · On-device — LLM 양자화와 복원

```python
w = torch.clamp(torch.round(w / scales) + zeros, 0, max_int)
w = (w - zeros) * scales
```

정수 코드를 만든 다음 (q-zero)×scale로 복원합니다. 반환값은 실수이며 실제 int4 저장이 아닙니다.

출처: On-Device/실습/5. Quantization for LLM_answer.ipynb · 셀 18
