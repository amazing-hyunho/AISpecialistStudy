# 10월 복기 모의고사 정답·해설

코드의 의미가 같으면 수동으로 정답 인정할 수 있습니다. 웹 자동 채점은 제공 답안과 토큰을 비교하며 임의의 동치 코드를 실행하지 않습니다.

## 1. DPO 응답 토큰화

```python
chosen_full_tokens = tokenizer.encode(f"{prompt}\n\n### Response:\n{chosen_response}")
rejected_full_tokens = tokenizer.encode(f"{prompt}\n\n### Response:\n{rejected_response}")
```

두 응답 모두 같은 prompt와 Response 구분자를 포함해야 합니다. chosen_response와 rejected_response를 서로 바꾸지 않습니다.

자료: LLM/Chapter_7_Exercise_Follow_Instructions_dpo.ipynb · 셀 1

## 2. DPO 프롬프트 제외

```python
mask[:prompt.shape[0] + 2] = False
```

끝 인덱스 미포함 슬라이스입니다. +2는 해당 실습 기준이며 일반적인 토크나이저 규칙이 아닙니다.

자료: LLM/Chapter_7_Exercise_Follow_Instructions_dpo.ipynb · 셀 1

## 3. MHA Q/K/V 축 이동

```python
keys = keys.transpose(1, 2)
queries = queries.transpose(1, 2)
values = values.transpose(1, 2)
```

토큰 축 1과 head 축 2를 교환합니다. 마지막 두 축 교환은 점수 계산 시 keys에 적용하는 별도 연산입니다.

자료: LLM/Chapter_3_Excercise_Attention.ipynb · 셀 4

## 4. MHA 헤드 재결합

```python
context_vec = context_vec.contiguous().view(b, num_tokens, self.d_out)
```

transpose 후 비연속 메모리일 수 있으므로 contiguous()를 적용하고 마지막 두 축을 합칩니다.

자료: LLM/Chapter_3_Excercise_Attention.ipynb · 셀 4

## 5. GPT 토큰 임베딩

```python
self.tok_emb = nn.Embedding(cfg["vocab_size"], cfg["emb_dim"])
```

테이블은 어휘 수 × 임베딩 차원입니다. context_length는 위치 임베딩에 사용합니다.

자료: LLM/Chapter_4_Excercise_GPT.ipynb · 셀 4 / previous_chapters.py

## 6. GPT 위치 임베딩

```python
self.pos_emb = nn.Embedding(cfg["context_length"], cfg["emb_dim"])
```

최대 위치 수 × 임베딩 차원의 학습 가능한 테이블입니다.

자료: LLM/Chapter_4_Excercise_GPT.ipynb · 셀 4 / previous_chapters.py

## 7. GPT 임베딩 dropout

```python
self.drop_emb = nn.Dropout(cfg["drop_rate"])
```

토큰·위치 임베딩을 합산한 후 적용할 dropout입니다.

자료: LLM/Chapter_4_Excercise_GPT.ipynb · 셀 4 / previous_chapters.py

## 8. MCP 연결과 래퍼

```python
mcp_client = BasicMCPClient(external_mcp_server)
mcp_tool = McpToolSpec(client=mcp_client)
```

서버에 연결할 client를 먼저 만들고 client 인자로 도구 스펙에 전달합니다.

자료: RAG/2일차/실습 자료/Code/4_RAG_framework_evaluation_with_MCP.ipynb · 셀 43

## 9. 도구 목록 조회

```python
tools = await mcp_tool.to_tool_list_async()
```

FunctionAgent의 tools 인자에 넘길 목록이며 await가 필요합니다.

자료: RAG/2일차/실습 자료/Code/4_RAG_framework_evaluation_with_MCP.ipynb · 셀 43

## 10. 리소스 조회

```python
resources = await mcp_tool.fetch_resources()
```

리소스는 fetch_resources(), 도구 변환은 to_tool_list_async()입니다.

자료: RAG/2일차/실습 자료/Code/4_RAG_framework_evaluation_with_MCP.ipynb · 셀 44

## 11. FunctionAgent 선언

```python
tools=tools, llm=self.llm, system_prompt=SYSTEM_PROMPT,
```

FunctionAgent에 도구 목록, 언어 모델, 시스템 지침을 전달합니다.

자료: RAG/2일차/실습 자료/Code/4_RAG_framework_evaluation_with_MCP.ipynb · 셀 47

## 12. Agent Context 생성

```python
self.agent_context = Context(self.agent)
```

생성된 Context는 agent.run의 ctx로 전달합니다.

자료: RAG/2일차/실습 자료/Code/4_RAG_framework_evaluation_with_MCP.ipynb · 셀 47

## 13. Agent 실행 핸들러

```python
handler = self.agent.run(question, ctx=self.agent_context)
```

run이 반환한 handler에서 이벤트를 순회한 후 await handler로 최종 응답을 얻습니다.

자료: RAG/2일차/실습 자료/Code/4_RAG_framework_evaluation_with_MCP.ipynb · 셀 47

## 14. 학습용 증강·정규화

```python
T.RandomCrop(32, padding=4),
T.RandomHorizontalFlip(),
T.ToTensor(),
T.Normalize(CIFAR10_MEAN, CIFAR10_STD),
```

정규화는 텐서 변환 이후입니다. 평균·표준편차는 강의의 채널별 상수를 사용합니다.

자료: Vision/01_ResNet18_CIFAR10.ipynb · 셀 6

## 15. 테스트용 전처리

```python
T.ToTensor(),
T.Normalize(CIFAR10_MEAN, CIFAR10_STD),
```

테스트에서는 입력을 텐서로 바꾸고 동일한 평균·표준편차로 정규화합니다.

자료: Vision/01_ResNet18_CIFAR10.ipynb · 셀 6

## 16. CIFAR용 ResNet stem

```python
model.conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False)
model.maxpool = nn.Identity()
```

32×32 이미지가 초기 단계에서 과도하게 축소되지 않도록 stem과 pool을 수정합니다.

자료: Vision/01_ResNet18_CIFAR10.ipynb · 셀 9

## 17. ResNet 출력 분류기

```python
model.fc = nn.Linear(model.fc.in_features, num_classes)
```

분류기 입력 특징 수는 기존 모델에서 읽고 출력 수는 CIFAR-10의 10으로 설정합니다.

자료: Vision/01_ResNet18_CIFAR10.ipynb · 셀 9

## 18. NCF 임베딩 선언

```python
self.user_embedding = nn.Embedding(n_users, 32)
self.movie_embedding = nn.Embedding(n_movies, 32)
```

임베딩 테이블의 행 수는 ID 개수, 열 수는 잠재 벡터 차원입니다.

자료: TIME/7_8-recsys-practice/RecSys_NCF.ipynb · 셀 11

## 19. NCF 예측 레이어

```python
self.fc1 = nn.Linear(64, 32)
self.relu = nn.ReLU()
self.fc2 = nn.Linear(32, 1)
```

concat은 벡터 길이를 64로 만듭니다. 출력은 하나의 평점 예측입니다.

자료: TIME/7_8-recsys-practice/RecSys_NCF.ipynb · 셀 11

## 20. NCF 특징 결합

```python
input_embedding = torch.cat([user_embedding, movie_embedding], dim=1)
```

특징 축 1을 따라 이어 붙입니다. dim=0은 배치 축을 늘립니다.

자료: TIME/7_8-recsys-practice/RecSys_NCF.ipynb · 셀 11

## 21. 채널별 scale broadcast

```python
weight_scale = weight_scale.flatten().view(1, -1, 1, 1)
output = output.float()
```

배치와 공간 축에 동일한 채널 scale을 broadcast합니다. float scale 곱을 위해 누적값을 변환합니다.

자료: On-Device/실습/2. Quantization for CNN_answer.ipynb · 셀 64

## 22. CNN 재양자화

```python
output = output * (input_scale * weight_scale / output_scale)
output = output + output_zero_point
```

출력 scale로 나누고 출력 zero point를 더합니다. bias는 입력 zero point 보정이 완료됐다고 가정합니다.

자료: On-Device/실습/2. Quantization for CNN_answer.ipynb · 셀 64

## 23. CNN 반올림·범위 제한

```python
output = output.round().clamp(*get_quantized_range(feature_bitwidth)).to(torch.int8)
```

범위 제한을 dtype 변환보다 먼저 적용합니다. signed int8은 -128부터 127까지입니다.

자료: On-Device/실습/2. Quantization for CNN_answer.ipynb · 셀 64

## 24. LLM scale과 zero point

```python
max_int = 2 ** n_bit - 1
scales = (max_val - min_val).clamp(min=1e-5) / max_int
zeros = (-torch.round(min_val / scales)).clamp_(0, max_int)
```

zero point를 -round(min/scale)로 구해 [0,max_int]로 제한합니다. scale의 0 나눗셈을 방지합니다.

자료: On-Device/실습/5. Quantization for LLM_answer.ipynb · 셀 18

## 25. LLM 양자화와 복원

```python
w = torch.clamp(torch.round(w / scales) + zeros, 0, max_int)
w = (w - zeros) * scales
```

정수 코드를 만든 다음 (q-zero)×scale로 복원합니다. 반환값은 실수이며 실제 int4 저장이 아닙니다.

자료: On-Device/실습/5. Quantization for LLM_answer.ipynb · 셀 18
