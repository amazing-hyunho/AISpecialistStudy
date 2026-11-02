# 10월 복기 모의고사

권장 60분 · 25문항 · 각 4점 · 총 100점. 권장 시간과 배점은 학습용 설계입니다. 【빈칸】에 들어갈 코드만 작성하세요. 복기 기반 재구성 문제이며 실제 시험 원문이 아닙니다.

## 1. LLM — DPO 응답 토큰화 (4점)

선호·비선호 전체 시퀀스를 만드는 두 줄을 작성하세요. 위의 prompt는 문자열입니다.

```python
prompt_tokens = tokenizer.encode(prompt)
【빈칸】
```

## 2. LLM — DPO 프롬프트 제외 (4점)

prompt는 1차원 토큰 텐서입니다. 강의의 +2 규칙을 사용해 제외 구간을 False로 설정하세요.

```python
if mask_prompt_tokens:
    【빈칸】
```

## 3. LLM — MHA Q/K/V 축 이동 (4점)

세 텐서가 (B,T,H,Dh)입니다. (B,H,T,Dh)로 만드는 세 줄을 keys, queries, values 순서로 쓰세요.

```python
# head 분리를 위한 view는 완료됨
【빈칸】
attn_scores = queries @ keys.transpose(2, 3)
```

## 4. LLM — MHA 헤드 재결합 (4점)

D=H×Dh이며 context_vec는 이미 (B,T,H,Dh)입니다. contiguous와 view를 사용하세요.

```python
context_vec = (attn_weights @ values).transpose(1, 2)
【빈칸】
```

## 5. LLM — GPT 토큰 임베딩 (4점)

cfg의 vocab_size와 emb_dim으로 토큰 임베딩을 선언하세요.

```python
# GPTModel.__init__
【빈칸】
```

## 6. LLM — GPT 위치 임베딩 (4점)

cfg의 context_length와 emb_dim으로 위치 임베딩을 선언하세요.

```python
# GPTModel.__init__
【빈칸】
```

## 7. LLM — GPT 임베딩 dropout (4점)

drop_rate를 읽어 임베딩 dropout을 선언하세요.

```python
# GPTModel.__init__
【빈칸】
```

## 8. RAG — MCP 연결과 래퍼 (4점)

필요한 import는 완료됐습니다. external_mcp_server로 client와 McpToolSpec을 순서대로 선언하세요.

```python
external_mcp_server = "<MCP_SERVER_URL>"
【빈칸】
```

## 9. RAG — 도구 목록 조회 (4점)

비동기 메서드로 변환된 도구 목록을 tools에 저장하세요.

```python
# mcp_tool은 McpToolSpec 객체
【빈칸】
```

## 10. RAG — 리소스 조회 (4점)

MCP의 리소스를 비동기로 조회해 resources에 저장하세요.

```python
# 도구 목록 조회와 구분할 것
【빈칸】
```

## 11. RAG — FunctionAgent 선언 (4점)

빈칸에는 tools, llm, system_prompt 키워드 인자 세 개를 이 순서로 작성하세요.

```python
self.agent = FunctionAgent(
    name="Agent",
    description="An agent that can work with Our Knowledge Graph api.",
    【빈칸】
)
```

## 12. RAG — Agent Context 생성 (4점)

현재 agent의 워크플로 컨텍스트를 저장하세요.

```python
# FunctionAgent 생성 직후
【빈칸】
```

## 13. RAG — Agent 실행 핸들러 (4점)

question과 기존 컨텍스트로 실행 핸들러를 만드세요. 이 줄에서는 await하지 않습니다.

```python
【빈칸】
async for event in handler.stream_events():
    pass
response = await handler
return str(response)
```

## 14. Vision — 학습용 증강·정규화 (4점)

crop(32,padding=4) → horizontal flip → tensor → normalize의 네 항목을 작성하세요.

```python
train_tfms = T.Compose([
    【빈칸】
])
```

## 15. Vision — 테스트용 전처리 (4점)

랜덤 증강 없이 두 항목을 순서대로 작성하세요.

```python
test_tfms = T.Compose([
    【빈칸】
])
```

## 16. Vision — CIFAR용 ResNet stem (4점)

RGB→64채널, 3×3, stride=1, padding=1, bias=False인 conv1과 maxpool 제거 두 줄을 쓰세요.

```python
model = models.resnet18(weights=None)
【빈칸】
```

## 17. Vision — ResNet 출력 분류기 (4점)

기존 fc의 입력 차원을 유지하고 출력만 num_classes로 바꾸세요.

```python
# build_resnet18_for_cifar10 내부
【빈칸】
return model
```

## 18. Data — NCF 임베딩 선언 (4점)

user와 movie의 임베딩을 각각 32차원으로 선언하세요. user를 먼저 작성하세요.

```python
# Neural_Collaborative_Filtering.__init__
【빈칸】
```

## 19. Data — NCF 예측 레이어 (4점)

64→32 선형층, ReLU, 32→1 선형층을 fc1, relu, fc2에 선언하세요.

```python
# 두 32차원 임베딩을 concat하는 모델
【빈칸】
```

## 20. Data — NCF 특징 결합 (4점)

각 임베딩은 (B,32)입니다. 리스트와 torch.cat을 사용해 (B,64)를 만드세요.

```python
user_embedding = self.user_embedding(users)
movie_embedding = self.movie_embedding(movies)
【빈칸】
```

## 21. On-device — 채널별 scale broadcast (4점)

weight_scale을 flatten한 뒤 (1,OC,1,1)로 만들고 output을 float로 바꾸는 두 줄을 쓰세요.

```python
# output shape: (B,OC,H,W)
【빈칸】
```

## 22. On-device — CNN 재양자화 (4점)

수식은 output×(s_in×s_weight/s_out)+z_out입니다. scale 적용 후 zero point를 더하는 두 줄을 쓰세요.

```python
# output은 정수 Conv + shifted_bias를 float로 변환한 값
【빈칸】
```

## 23. On-device — CNN 반올림·범위 제한 (4점)

round → get_quantized_range로 clamp → int8 변환 순서로 output을 갱신하세요.

```python
# 이 문제의 feature_bitwidth는 8
【빈칸】
return output
```

## 24. On-device — LLM scale과 zero point (4점)

max_int=2**n_bit-1, scale=clamp(max-min,min=1e-5)/max_int입니다. max_int, scales, zeros 세 줄을 강의 방식으로 쓰세요.

```python
# max_val/min_val은 keepdim=True로 이미 계산됨
【빈칸】
```

## 25. On-device — LLM 양자화와 복원 (4점)

w/scale 반올림 후 zero point를 더해 [0,max_int]로 clamp하고, 다음 줄에서 실수로 복원하세요.

```python
# scales와 zeros는 이미 계산됨
【빈칸】
w = w.reshape(org_w_shape)
```
