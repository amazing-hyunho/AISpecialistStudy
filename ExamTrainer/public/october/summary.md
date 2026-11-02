# 10월 AI Specialist 시험 복기 정리

사용자 제공 복기 및 로컬 강의 코드 대조 기준. 정리일: 2026-11-03. 공식 시험지나 다음 시험 출제 범위가 아닙니다.

## LLM — DPO: 선호 데이터 토큰화와 프롬프트 마스크

자료: LLM/Chapter_7_Exercise_Follow_Instructions_dpo.ipynb · 셀 1

- prompt는 질문만, chosen/rejected는 질문 + Response 구분자 + 각 응답을 인코딩합니다. 원본 ????는 바로 위에서 정의한 응답 변수로 복원했습니다.
- 마스크 False 위치는 로그확률 집계에서 제외합니다. 패딩 마스킹도 별도로 필요합니다.
- prompt.shape[0] + 2는 이 강의의 구현값입니다. 모든 토크나이저에서 구분자가 2토큰이라는 뜻은 아닙니다.

```python
prompt = format_input(entry)
chosen_response = entry["chosen"]
rejected_response = entry["rejected"]
prompt_tokens = tokenizer.encode(prompt)
chosen_full_tokens = tokenizer.encode(f"{prompt}\n\n### Response:\n{chosen_response}")
rejected_full_tokens = tokenizer.encode(f"{prompt}\n\n### Response:\n{rejected_response}")

# custom_collate_fn 내부: prompt는 1차원 토큰 텐서
if mask_prompt_tokens:
    mask[:prompt.shape[0] + 2] = False
```

## LLM — MultiHeadAttention: 헤드 분리·축 이동·결합

자료: LLM/Chapter_3_Excercise_Attention.ipynb · 셀 4

- Q/K/V: (B,T,D) → view → (B,T,H,Dh) → transpose(1,2) → (B,H,T,Dh). D = H × Dh입니다.
- 점수는 (B,H,T,T), attention과 V의 곱은 (B,H,T,Dh)입니다.
- 헤드 결합 전 transpose로 (B,T,H,Dh)를 만들고 contiguous().view로 (B,T,D)를 만듭니다. 축 이동을 생략하면 토큰과 헤드가 섞입니다.

```python
keys = keys.view(b, num_tokens, self.num_heads, self.head_dim)
queries = queries.view(b, num_tokens, self.num_heads, self.head_dim)
values = values.view(b, num_tokens, self.num_heads, self.head_dim)
keys = keys.transpose(1, 2)
queries = queries.transpose(1, 2)
values = values.transpose(1, 2)
attn_scores = queries @ keys.transpose(2, 3)
# causal mask, softmax 및 dropout 적용 후
context_vec = (attn_weights @ values).transpose(1, 2)
context_vec = context_vec.contiguous().view(b, num_tokens, self.d_out)
```

## LLM — GPTModel: 토큰·위치 임베딩과 dropout

자료: LLM/Chapter_4_Excercise_GPT.ipynb · 셀 4 / LLM/previous_chapters.py

- 토큰 임베딩은 vocab_size × emb_dim, 위치 임베딩은 context_length × emb_dim입니다.
- forward는 토큰 + 위치 → dropout → Transformer blocks → final norm → output head 순서입니다.

```python
self.tok_emb = nn.Embedding(cfg["vocab_size"], cfg["emb_dim"])
self.pos_emb = nn.Embedding(cfg["context_length"], cfg["emb_dim"])
self.drop_emb = nn.Dropout(cfg["drop_rate"])
```

## RAG — MCP Client → ToolSpec → 도구·리소스

자료: RAG/2일차/실습 자료/Code/4_RAG_framework_evaluation_with_MCP.ipynb · 셀 38·43·44

- BasicMCPClient는 서버 연결, McpToolSpec은 도구 사용을 위한 래퍼입니다. tools 조회와 resources 조회를 구분합니다.
- 두 조회 호출은 비동기이므로 await를 사용합니다. 주소는 학습용 placeholder이며 실제 서버 주소로 바꿔야 합니다.
- 이 자료는 저장된 강의 API 기준입니다. 실제 실행은 설치 버전과 서버 endpoint/transport를 맞춰야 합니다. 모의고사는 서버 연결 없이 응시합니다.

```python
from llama_index.tools.mcp import BasicMCPClient, McpToolSpec
from llama_index.core.agent.workflow import FunctionAgent, ToolCallResult, ToolCall
from llama_index.core.workflow import Context

external_mcp_server = "<MCP_SERVER_URL>"
mcp_client = BasicMCPClient(external_mcp_server)
mcp_tool = McpToolSpec(client=mcp_client)
tools = await mcp_tool.to_tool_list_async()
resources = await mcp_tool.fetch_resources()
```

## RAG — KGQueryEngineWithMCP: Agent 초기화·Context·이벤트

자료: RAG/2일차/실습 자료/Code/4_RAG_framework_evaluation_with_MCP.ipynb · 셀 47

- 도구 설명이 1000자를 넘으면 앞부분 + ...로 줄이고 FunctionAgent에 tools·llm·system_prompt를 전달합니다.
- Context(self.agent)를 생성해 run의 ctx로 전달합니다. stream_events는 실행 중 이벤트, await handler는 최종 응답입니다.
- MCP·Agent·Context의 import는 앞 절을 참고하세요. SYSTEM_PROMPT는 강의에서 준비한 값입니다. query 전에 await init_agent()를 호출해야 합니다.

```python
from typing import Optional
from llama_index.llms.openai import OpenAI

class KGQueryEngineWithMCP:
    def __init__(self, mcp_tool_spec: McpToolSpec, model: str, llm=None):
        self.llm = llm or OpenAI(model=model, temperature=0)
        self.mcp_tool_spec = mcp_tool_spec
        self.agent: Optional[FunctionAgent] = None
        self.agent_context: Optional[Context] = None

    async def init_agent(self):
        tools = await self.mcp_tool_spec.to_tool_list_async()
        for tool in tools:
            if len(tool.metadata.description) > 1000:
                tool.metadata.description = tool.metadata.description[:1000] + "..."
        self.agent = FunctionAgent(
            name="Agent",
            description="An agent that can work with Our Knowledge Graph api.",
            tools=tools, llm=self.llm, system_prompt=SYSTEM_PROMPT,
        )
        self.agent_context = Context(self.agent)

    async def query(self, question: str, verbose: bool = False) -> str:
        handler = self.agent.run(question, ctx=self.agent_context)
        async for event in handler.stream_events():
            if verbose and type(event) == ToolCall:
                print(f"Calling tool {event.tool_name} with kwargs {event.tool_kwargs}")
            elif verbose and type(event) == ToolCallResult:
                print(f"Tool {event.tool_name} returned {event.tool_output}")
        response = await handler
        return str(response)
```

## Vision — CIFAR-10 전처리와 ResNet18 수정

자료: Vision/01_ResNet18_CIFAR10.ipynb · 셀 6·9

- train: crop → flip → tensor → normalize. test: tensor → normalize. 검증·테스트에 랜덤 증강을 추가하지 않습니다.
- Normalize는 (x - mean) / std입니다. 원문 주석의 -2.5~2.5는 고정 범위가 아닙니다. 강의 평균·표준편차 기준 채널별 끝값도 다릅니다.
- CIFAR용 stem은 3×3, stride 1, padding 1이고 maxpool을 Identity로 바꿉니다. fc 출력은 num_classes입니다.
- 원문 끝의 conv1/fc 중복과 잘못된 들여쓰기는 아래 정리에서 제거했습니다. num_params는 sum(p.numel() for p in model.parameters())입니다.

```python
train_tfms = T.Compose([
    T.RandomCrop(32, padding=4),
    T.RandomHorizontalFlip(),
    T.ToTensor(),
    T.Normalize(CIFAR10_MEAN, CIFAR10_STD),
])
test_tfms = T.Compose([
    T.ToTensor(),
    T.Normalize(CIFAR10_MEAN, CIFAR10_STD),
])

def build_resnet18_for_cifar10(num_classes: int = 10):
    model = models.resnet18(weights=None)
    model.conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False)
    model.maxpool = nn.Identity()
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model
```

## Data — NCF: 두 임베딩 결합과 평점 예측

자료: TIME/7_8-recsys-practice/RecSys_NCF.ipynb · 셀 11

- 사용자·영화 ID 입력이 각각 (B,)이면 Embedding 출력은 각각 (B,32), cat(dim=1) 결과는 (B,64)입니다.
- 64 → 32 → ReLU → 1로 평점을 예측합니다. 이 코드에는 sigmoid가 없습니다. NGCF의 그래프 집계와 구분합니다.

```python
# __init__ 내부
self.user_embedding = nn.Embedding(n_users, 32)
self.movie_embedding = nn.Embedding(n_movies, 32)
self.fc1 = nn.Linear(64, 32)
self.relu = nn.ReLU()
self.fc2 = nn.Linear(32, 1)

# forward 내부
user_embedding = self.user_embedding(users)
movie_embedding = self.movie_embedding(movies)
input_embedding = torch.cat([user_embedding, movie_embedding], dim=1)
hidden_feature = self.relu(self.fc1(input_embedding))
output = self.fc2(hidden_feature)
```

## On-device — CNN: 출력 재양자화와 채널별 scale

자료: On-Device/실습/2. Quantization for CNN_answer.ipynb · 셀 62·64

- 이미 정수 Conv 누적과 보정 bias를 합산한 output에 s_in × s_weight / s_out을 곱하고 z_out을 더합니다.
- weight_scale은 (1,OC,1,1)로 바꿔 (B,OC,H,W)에 broadcast합니다.
- 복기 수식의 bias는 입력 zero point 보정을 반영한 shifted_bias를 전제로 합니다. 대칭 weight(z_weight=0)에서 shifted_bias = q_bias - z_input × sum(q_weight), 합산 축은 (1,2,3)입니다.
- 마지막 순서는 round → clamp → int8입니다. signed 8-bit는 [-128,127]이며 강의의 int8 반환을 다른 비트폭·dtype에 그대로 일반화하지 마세요.

```python
# 앞 단계에서 Conv 누적 + shifted_bias까지 계산한 output
weight_scale = weight_scale.flatten().view(1, -1, 1, 1)
output = output.float()
output = output * (input_scale * weight_scale / output_scale)
output = output + output_zero_point
output = output.round().clamp(*get_quantized_range(feature_bitwidth)).to(torch.int8)
```

## On-device — LLM: pseudo_quantize_tensor

자료: On-Device/실습/5. Quantization for LLM_answer.ipynb · 셀 18

- max_val/min_val은 행 또는 그룹별 값이며 keepdim=True로 구합니다. 그룹화하면 마지막 축이 q_group_size로 나누어져야 합니다.
- 정수 코드 범위는 [0,2^n_bit-1]입니다. CNN signed int8 범위와 다릅니다.
- clamp(min=1e-5)는 동일한 최대·최소값에서 scale이 0이 되는 것을 막습니다. 마지막 복원 결과는 실수이므로 실제 저비트 저장이 아닌 양자화 효과 모사입니다.

```python
max_int = 2 ** n_bit - 1
scales = (max_val - min_val).clamp(min=1e-5) / max_int
zeros = (-torch.round(min_val / scales)).clamp_(0, max_int)
w = torch.clamp(torch.round(w / scales) + zeros, 0, max_int)
w = (w - zeros) * scales
# 그룹화했다면 마지막에 원래 shape로 복원
w = w.reshape(org_w_shape)
```
