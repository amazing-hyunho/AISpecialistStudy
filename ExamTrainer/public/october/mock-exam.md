# 10월 복기 모의고사

권장 60분 · 25문항 · 각 4점 · 총 100점. 권장 시간과 배점은 학습용 설계입니다. 【빈칸】에 들어갈 코드만 작성하세요. 복기 기반 재구성 문제이며 실제 시험 원문이 아닙니다.

## 1. LLM — DPO 응답 토큰화 (4점)

질문과 각 응답을 포함한 선호·비선호 시퀀스를 토큰화하는 두 줄을 작성하세요. prompt는 문자열입니다.

```python
prompt_tokens = tokenizer.encode(prompt)
【빈칸】
```

## 2. LLM — DPO 프롬프트 제외 (4점)

응답만 학습하도록 프롬프트 구간을 마스크에서 제외하세요. prompt는 1차원이며, 강의에서 정한 구분자 길이는 2토큰입니다.

```python
if mask_prompt_tokens:
    【빈칸】
```

## 3. LLM — MHA Q/K/V 축 이동 (4점)

세 텐서의 형태를 (B,T,H,Dh)에서 (B,H,T,Dh)로 바꾸는 세 줄을 작성하세요. 작성 순서는 keys, queries, values입니다.

```python
# head 분리를 위한 view는 완료됨
【빈칸】
attn_scores = queries @ keys.transpose(2, 3)
```

## 4. LLM — MHA 헤드 재결합 (4점)

context_vec의 형태를 (B,T,H,Dh)에서 (B,T,D)로 바꾸세요. D는 H와 Dh의 곱입니다.

```python
context_vec = (attn_weights @ values).transpose(1, 2)
【빈칸】
```

## 5. LLM — GPT 토큰 임베딩 (4점)

설정에 맞는 토큰 임베딩 레이어를 선언하세요.

```python
# GPTModel.__init__
【빈칸】
```

## 6. LLM — GPT 위치 임베딩 (4점)

설정에 맞는 위치 임베딩 레이어를 선언하세요.

```python
# GPTModel.__init__
【빈칸】
```

## 7. LLM — GPT 임베딩 dropout (4점)

설정에 맞는 임베딩 드롭아웃 레이어를 선언하세요.

```python
# GPTModel.__init__
【빈칸】
```

## 8. RAG — MCP 연결과 래퍼 (4점)

주어진 서버 주소로 클라이언트와 도구 어댑터를 순서대로 생성하세요. 필요한 import는 완료됐습니다.

```python
external_mcp_server = "<MCP_SERVER_URL>"
【빈칸】
```

## 9. RAG — 도구 목록 조회 (4점)

서버에서 제공하는 도구 목록을 조회해 tools에 저장하세요.

```python
# mcp_tool은 McpToolSpec 객체
【빈칸】
```

## 10. RAG — 리소스 조회 (4점)

서버에서 제공하는 리소스를 조회해 resources에 저장하세요.

```python
# 도구 목록 조회와 구분할 것
【빈칸】
```

## 11. RAG — FunctionAgent 선언 (4점)

준비된 도구·언어 모델·시스템 지침을 Agent에 연결하는 세 줄을 작성하세요.

```python
self.agent = FunctionAgent(
    name="Agent",
    description="An agent that can work with Our Knowledge Graph api.",
    【빈칸】
)
```

## 12. RAG — Agent Context 생성 (4점)

현재 Agent의 실행 문맥을 생성하세요.

```python
# FunctionAgent 생성 직후
【빈칸】
```

## 13. RAG — Agent 실행 핸들러 (4점)

질문과 기존 실행 문맥으로 Agent를 실행해 핸들러를 얻으세요. 최종 결과를 기다리는 처리는 뒤에서 수행합니다.

```python
【빈칸】
async for event in handler.stream_events():
    pass
response = await handler
return str(response)
```

## 14. Vision — 학습용 증강·정규화 (4점)

학습용 변환 네 항목을 작성하세요. 패딩 4인 32×32 무작위 자르기, 좌우 반전, 텐서 변환, 데이터셋 통계에 따른 정규화 순서입니다.

```python
train_tfms = T.Compose([
    【빈칸】
])
```

## 15. Vision — 테스트용 전처리 (4점)

테스트용 변환 두 항목을 작성하세요. 학습과 같은 데이터셋 통계를 사용하고 무작위 증강은 제외하세요.

```python
test_tfms = T.Compose([
    【빈칸】
])
```

## 16. Vision — CIFAR용 ResNet stem (4점)

작은 RGB 이미지용 첫 합성곱과 공간 축소를 제거한 풀링 레이어를 선언하세요. 출력 64채널, 커널 3×3, 보폭 1, 패딩 1, 편향 없음입니다.

```python
model = models.resnet18(weights=None)
【빈칸】
```

## 17. Vision — ResNet 출력 분류기 (4점)

기존 분류기의 입력 차원은 유지하고 출력 차원을 num_classes로 변경하세요.

```python
# build_resnet18_for_cifar10 내부
【빈칸】
return model
```

## 18. Data — NCF 임베딩 선언 (4점)

사용자와 영화의 임베딩을 각각 32차원으로 선언하세요. 사용자를 먼저 작성하세요.

```python
# Neural_Collaborative_Filtering.__init__
【빈칸】
```

## 19. Data — NCF 예측 레이어 (4점)

예측 레이어를 선언하세요. 두 32차원 임베딩을 결합한 입력을 32차원으로 바꾸고, 음수 출력을 0으로 제한한 뒤 하나의 평점을 예측합니다.

```python
# 두 32차원 임베딩을 concat하는 모델
【빈칸】
```

## 20. Data — NCF 특징 결합 (4점)

각각 (B,32)인 사용자·영화 특징을 결합해 (B,64)를 만드세요.

```python
user_embedding = self.user_embedding(users)
movie_embedding = self.movie_embedding(movies)
【빈칸】
```

## 21. On-device — 채널별 scale broadcast (4점)

채널별 scale이 (B,OC,H,W)에 적용되도록 형태를 바꾸고 누적 출력을 실수형으로 변환하는 두 줄을 작성하세요.

```python
# output shape: (B,OC,H,W)
【빈칸】
```

## 22. On-device — CNN 재양자화 (4점)

입력·가중치·출력 scale과 출력 zero point를 반영해 재양자화하는 두 줄을 작성하세요. 입력 zero point의 bias 보정은 완료됐습니다.

```python
# output은 정수 Conv + shifted_bias를 float로 변환한 값
【빈칸】
```

## 23. On-device — CNN 반올림·범위 제한 (4점)

출력을 부호 있는 8비트 정수로 변환하세요. 가장 가까운 정수값을 사용하고 허용 범위를 벗어난 값은 경계값으로 제한하세요.

```python
# 이 문제의 feature_bitwidth는 8
【빈칸】
return output
```

## 24. On-device — LLM scale과 zero point (4점)

주어진 비트폭과 최솟값·최댓값으로 정수 코드의 최댓값, scale, zero point를 계산하세요. 최소 scale 분자는 1e-5이며 코드 범위는 0부터 시작합니다.

```python
# max_val/min_val은 keepdim=True로 이미 계산됨
【빈칸】
```

## 25. On-device — LLM 양자화와 복원 (4점)

주어진 scale·zero point·정수 범위로 가중치를 양자화한 뒤 실수 가중치로 복원하는 두 줄을 작성하세요.

```python
# scales와 zeros는 이미 계산됨
【빈칸】
w = w.reshape(org_w_shape)
```
