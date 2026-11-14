# 11월 대비 1회 — 먼저 준비할 후보 — 정답·해설

빈칸당 4점, 과목당 20점, 총 100점. 미작성은 0점. 아래는 예시 답안이며 같은 shape와 동작의 동등한 구현도 정답으로 인정합니다. API 이름만 묻는 빈칸은 해당 위치에 들어갈 부분만 작성합니다. 다중 줄은 필요한 동작을 모두 충족하면 4점으로 채점하세요.

## 1번 · LLM — MHA keys 헤드 분리

```python
keys.view(b, num_tokens, self.num_heads, self.head_dim)
```

view는 원소 수를 유지하며 마지막 특징 축을 헤드 수와 헤드 차원으로 나눕니다. Q/K/V 세 텐서에 같은 형태 변환을 적용합니다.

출처: Chapter_3_Attention_Mechanisms_KR.ipynb · 셀 136

## 2번 · LLM — MHA 헤드 축 이동

```python
keys.transpose(1, 2)
```

시간 축 1과 헤드 축 2를 교환해야 헤드별 토큰 행렬 곱을 수행할 수 있습니다. view로 축의 의미를 바꾸는 것과 구분합니다.

출처: Chapter_3_Attention_Mechanisms_KR.ipynb · 셀 136

## 3번 · LLM — 출력 헤드

```python
nn.Linear(cfg["emb_dim"], cfg["vocab_size"], bias=False)
```

임베딩을 어휘 점수로 변환하는 출력 헤드를 만드세요.

출처: llm_from_scratch/images/Chapter_4_Excercise_GPT.ipynb · 셀 3

## 4번 · LLM — 마지막 시점

```python
logits[:, -1, :]
```

다음 토큰 예측에 마지막 시점 logits만 선택하세요.

출처: llm_from_scratch/images/Chapter_4_Excercise_GPT.ipynb · 셀 4

## 5번 · LLM — Greedy Decoding

```python
torch.argmax(logits, dim=-1, keepdim=True)
```

argmax는 어휘 차원의 logit 중 가장 큰 값의 token index를 고르며 keepdim은 다음 토큰 연결에 필요한 차원을 유지합니다.

출처: llm_from_scratch/images/Chapter_4_Excercise_GPT.ipynb · 셀 4

## 6번 · RAG — 인덱스 생성

```python
VectorStoreIndex.from_documents(documents)
```

문서 목록을 전달하면 LlamaIndex가 문서를 node로 나누고 embedding을 만들어 vector index를 구성합니다.

출처: 1. Llama_index.ipynb · 셀 15

## 7번 · RAG — Query Engine 구성

```python
index.as_query_engine()
```

retriever는 관련 노드를 가져오고 query engine은 검색과 응답 합성을 묶는 질의 인터페이스입니다. from_documents로 만든 index에서 구성합니다.

출처: 1. Llama_index.ipynb · 셀 32

## 8번 · RAG — Top-k 검색

```python
base_index.as_retriever(similarity_top_k=topk)
```

similarity_top_k는 질문과 가장 유사한 문서 조각을 몇 개 반환할지 제한합니다.

출처: 2. Task_1.ipynb · 셀 16

## 9번 · RAG — 질문과 근거 메시지

```python
{"role": "user", "content": user_message}
```

앞에서 만든 user_message에는 검색 references와 사용자의 질문이 함께 들어 있습니다. 이를 role=user 메시지로 전달하고 role=system에는 답변 지침을 넣습니다. 검색만 하고 이 본문을 모델 입력에 넣지 않으면 검색 근거가 생성 단계에 전달되지 않습니다.

출처: 2. Task_1.ipynb · 셀 23

## 10번 · RAG — 검색에서 생성으로

```python
self.reader.generate_response(query, retrieved_results)
```

retriever가 가져온 chunk 목록을 질문과 함께 Reader에 전달하는 연결 지점입니다. Reader 내부에서 프롬프트를 구성하고 Chat Completion으로 답변을 만듭니다. 검색 결과 목록 자체와 최종 답변 문자열을 구분하세요.

출처: 2. Task_1.ipynb · 셀 29

## 11번 · Data — Encoder 입력 구간

```python
data[i:i + sequence_length]
```

slice의 끝은 포함하지 않습니다. 현재 시작점에서 과거 입력 길이만큼 자르며 타깃은 이 구간 다음부터 시작합니다.

출처: ts_solution.ipynb · 셀 41

## 12번 · Data — Decoder 정답 구간

```python
data[i + sequence_length : \
                           i + sequence_length + target_len]
```

입력 끝 다음부터 미래 T개를 정답으로 묶습니다. 본문 range는 강의 원문을 유지했으며 가능한 마지막 창 하나를 포함하는 일반 구현과는 상한이 다를 수 있습니다.

출처: ts_solution.ipynb · 셀 41

## 13번 · Data — Decoder 초기 입력

```python
source[:, -1, :].unsqueeze(1)
```

마지막 시점을 고르면 (B,F)이므로 unsqueeze(1)로 RNN 입력에 필요한 길이 1의 시간 축을 만듭니다.

출처: ts_solution.ipynb · 셀 43

## 14번 · Data — 예측을 다음 입력으로

```python
input = out
```

정답을 넣는 teacher forcing 대신 이전 예측을 다시 입력하는 자기회귀 예측입니다.

출처: ts_solution.ipynb · 셀 43

## 15번 · Data — 예측 시간 축 생성

```python
torch.stack(predictions, dim=1)
```

stack은 새 차원을 만들고 cat은 기존 차원을 늘립니다. 시간별 예측 목록은 새 시간 축 1에 쌓습니다.

출처: ts_solution.ipynb · 셀 43

## 16번 · Vision — QKV Projection

```python
nn.Linear(dim, inner_dim * 3, bias = False)
```

하나의 Linear layer가 inner_dim의 3배를 출력하면 결과를 세 조각으로 나눠 Q, K, V를 효율적으로 만들 수 있습니다.

출처: 02_ViT_CIFAR10.ipynb · 셀 8

## 17번 · Vision — Scaled Dot-product

```python
einsum
```

einsum으로 각 head의 Q와 K 내적을 계산하고 sqrt 차원에 해당하는 scale을 곱해 softmax 포화를 완화합니다.

출처: 02_ViT_CIFAR10.ipynb · 셀 8

## 18번 · Vision — Attention Value 가중합

```python
einsum
```

J축을 따라 attention 가중치와 Value를 합산해 (B,H,I,D)를 만듭니다.

출처: Vision/02_ViT_CIFAR10.ipynb · 셀 8

## 19번 · Vision — Attention Residual

```python
attn(x) + x
```

Attention으로 토큰 간 정보를 섞은 결과에 원래 입력을 더해 잔차 경로를 만듭니다. 두 Tensor의 형태가 같아야 하며, U-Net에서 채널 수를 늘리는 concat과는 다릅니다.

출처: 02_ViT_CIFAR10.ipynb · 셀 8

## 20번 · Vision — FFN Residual

```python
ff(x) + x
```

Attention residual 다음의 FFN도 입력과 출력 shape를 맞춰 잔차 덧셈을 수행합니다. torch.cat으로 채널을 늘리는 연결이 아닙니다.

출처: 02_ViT_CIFAR10.ipynb · 셀 8

## 21번 · On-device — 커널 중요도 합산

```python
weight.abs().sum(dim=(2, 3), keepdim=True)
```

출력·입력 채널 축(0, 1)은 남기고 커널 높이·너비 축(2, 3)만 절댓값 합산합니다. 채널 프루닝의 dim=(0, 2, 3)과 구분하세요.

출처: 1. Pruning for CNN_answer.ipynb · 셀 33

## 22번 · On-device — 커널 Pruning Threshold

```python
torch.kthvalue(importance.flatten(), num_pruned_kernels)[0]
```

kthvalue는 오름차순 k번째 값과 인덱스를 반환하므로 [0]으로 값만 꺼내 커널 제거 경계값으로 사용합니다.

출처: 1. Pruning for CNN_answer.ipynb · 셀 33

## 23번 · On-device — 입력 채널 수

```python
weight.shape[1]
```

축 1이 입력 채널입니다. 여기서는 groups=1인 일반 convolution 형태를 전제로 합니다.

출처: 1. Pruning for CNN_answer.ipynb · 셀 35

## 24번 · On-device — 채널 중요도 합산

```python
weight.abs().sum(dim=(0, 2, 3), keepdim=True)
```

출력 채널과 커널 공간 축을 합산하고 입력 채널 축을 보존합니다. keepdim은 이후 broadcast에 필요한 크기 1의 축들을 남깁니다.

출처: 1. Pruning for CNN_answer.ipynb · 셀 35

## 25번 · On-device — 채널 mask 확장

```python
mask.expand_as(weight)
```

채널별 유지 여부를 해당 채널의 모든 가중치 위치에 적용합니다. 이 코드는 가중치를 0으로 만들며 구조 자체의 채널 수를 줄이지는 않습니다.

출처: 1. Pruning for CNN_answer.ipynb · 셀 35
