# 11월 대비 모의고사 2회 — 다음 후보

범위: DPO·LoRA / MCP Client·Tool·Agent / NGCF·NCF / CIFAR 전처리·ResNet / CNN·LLM 양자화

권장 60분 · 25빈칸 · 빈칸당 4점 · 총 100점. 시간과 배점은 연습용입니다.

복기에서 고른 대비 후보이며 실제 11월 출제나 확률을 검증한 자료가 아닙니다. 2회는 보완 범위이며 난이도 순서가 아닙니다.

## 응시 방법

- 【빈칸 번호】에 들어갈 코드만 답안란에 작성하세요. 여러 줄이 필요한 빈칸도 있습니다.
- 같은 셀의 출제 빈칸은 동시에 가렸으며, 나머지 코드는 제공합니다. 전체 셀을 읽고 답하세요.
- 강의 셀의 import·데이터·앞선 셀의 정의는 준비됐다고 가정합니다. 셀을 독립 실행하는 시험은 아닙니다.
- 수식과 고정 설정은 제공된 코드를 참고하세요. 강의 API 기준이며 서버 연결은 필요하지 않습니다.
- 풀 때 정답 파일은 열지 마세요. 답안란은 문서 하단에 있습니다.

## LLM — 빈칸 1, 2, 3

출처: LLM/Chapter_7_Exercise_Follow_Instructions_dpo.ipynb · 셀 0

- **1번 · 자동회귀 시프트**: 자동회귀 정답은 다음 토큰입니다. 첫 토큰을 제외하는 슬라이스만 작성하세요.
- **2번 · 정답 로그확률**: 로그확률에서 labels가 가리키는 위치를 모읍니다. input·dim·index 인수는 제공됩니다.
- **3번 · DPO Loss**: DPO 수식의 부호와 beta 배율은 제공됩니다. sigmoid의 로그를 안정적으로 계산하는 함수만 채우세요.

```python
import os
import json
import time
import requests
import torch
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from functools import partial
import tiktoken

# ==========================================
# [중요] 외부 모듈 의존성 처리
# 이 코드는 책이나 튜토리얼의 일부로, 이전 챕터에서 정의된 모델(GPTModel)이 필요합니다.
# ==========================================
try:
    from previous_chapters import GPTModel, generate_and_print_sample, download_model
except ImportError:
    print("경고: 'previous_chapters' 모듈을 찾을 수 없습니다. GPTModel 등의 정의가 필요합니다.")

# ==========================================
# 1. 설정 및 데이터 로드 유틸리티
# 데이터를 인터넷에서 다운로드하거나 로컬에서 불러오는 기능을 담당합니다.
# ==========================================
def download_and_load_file(file_path, url):
    """
    지정된 경로에 파일이 없으면 URL에서 다운로드하고,
    파일을 읽어 JSON 데이터를 반환합니다.
    """
    if not os.path.exists(file_path):
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(response.text)
    else:
        with open(file_path, "r", encoding="utf-8") as file:
            text_data = file.read()
    return json.loads(text_data)


def format_input(entry):
    """
    JSON 데이터의 항목을 모델이 이해할 수 있는 프롬프트 형식으로 변환합니다.
    (알파카(Alpaca) 데이터셋 스타일 포맷팅)
    """
    instruction_text = (
        f"Below is an instruction that describes a task. "
        f"Write a response that appropriately completes the request."
        f"\n\n### Instruction:\n{entry['instruction']}"
    )
    # 추가 입력(Input)이 있는 경우에만 붙임
    input_text = f"\n\n### Input:\n{entry['input']}" if entry["input"] else ""
    return instruction_text + input_text

# ==========================================
# 2. 데이터셋 및 Collate 함수 (DPO용)
# DPO는 (프롬프트, 선택된 답변, 거부된 답변)의 쌍이 필요합니다.
# ==========================================
class PreferenceDataset(Dataset):
    def __init__(self, data, tokenizer):
        self.data = data
        self.encoded_texts = []

        # 데이터를 미리 토큰화(Tokenization)하여 저장합니다.
        for entry in data:
            prompt = format_input(entry)
            rejected_response = entry["rejected"] # 👎 덜 선호되는 답변
            chosen_response = entry["chosen"]     # 👍 더 선호되는 답변

            # 프롬프트 부분만 따로 인코딩 (나중에 마스킹하기 위해 필요)
            prompt_tokens = tokenizer.encode(prompt)

            # 프롬프트 + 답변 형태로 전체 문장을 인코딩
            # TODO: 선호/비선호 응답 변수명을 채우세요.
            # 힌트: 바로 위에서 만든 chosen_response와 rejected_response를 Response 뒤에 붙입니다.
            # 예시: chosen 쪽은 chosen_response, rejected 쪽은 rejected_response를 사용합니다.
            chosen_full_tokens = tokenizer.encode(f"{prompt}\n\n### Response:\n{chosen_response}")
            rejected_full_tokens = tokenizer.encode(f"{prompt}\n\n### Response:\n{rejected_response}")

            self.encoded_texts.append({
                "prompt": prompt_tokens,
                "chosen": chosen_full_tokens,
                "rejected": rejected_full_tokens,
            })

    def __getitem__(self, index):
        return self.encoded_texts[index]

    def __len__(self):
        return len(self.data)

def custom_collate_fn(batch, pad_token_id=50256, allowed_max_length=None, mask_prompt_tokens=True, device="cpu"):
    """
    배치(Batch) 내의 데이터 길이를 맞추고(Padding), 마스크(Mask)를 생성하는 함수입니다.
    """
    batch_data = {
        "prompt": [],
        "chosen": [],
        "rejected": [],
        "rejected_mask": [], # Loss 계산 시 무시할 부분 (패딩 등)
        "chosen_mask": []
    }

    # 1. 배치 내에서 가장 긴 시퀀스 길이 찾기 (패딩을 위해)
    max_length_common = 0
    if batch:
        for key in ["chosen", "rejected"]:
            current_max = max(len(item[key]) + 1 for item in batch)
            max_length_common = max(max_length_common, current_max)

    # 2. 패딩 추가 및 마스크 생성
    for item in batch:
        prompt = torch.tensor(item["prompt"])
        batch_data["prompt"].append(prompt)

        for key in ["chosen", "rejected"]:
            sequence = item[key]
            # 최대 길이에 맞춰 패딩 토큰 추가
            padded = sequence + [pad_token_id] * (max_length_common - len(sequence))

            # 기본 마스크: 데이터가 있는 곳은 1(True), 패딩은 0(False)
            mask = torch.ones(len(padded)).bool()
            mask[len(sequence):] = False  # 패딩 부분 마스킹

            # [중요] 프롬프트 부분 마스킹 (선택적)
            # DPO는 '답변'의 확률 차이를 학습하므로, 질문(Prompt) 부분은 Loss 계산에서 제외합니다.
            # +2는 \n\n때문
            if mask_prompt_tokens:
                mask[:prompt.shape[0] + 2] = False

            batch_data[key].append(torch.tensor(padded))
            batch_data[f"{key}_mask"].append(mask)

    # 3. 텐서 변환 및 디바이스(GPU/CPU) 이동
    for key in ["chosen", "rejected", "chosen_mask", "rejected_mask"]:
        tensor_stack = torch.stack(batch_data[key])
        # 길이 제한이 있다면 자르기
        if allowed_max_length is not None:
            tensor_stack = tensor_stack[:, :allowed_max_length]
        batch_data[key] = tensor_stack.to(device)

    return batch_data

# ==========================================
# 3. DPO Loss 및 Log Probability 계산 함수
# DPO의 핵심 수학적 로직이 들어있는 부분입니다.
# ==========================================
def compute_logprobs(logits, labels, selection_mask=None):
    """
    모델의 출력(logits)과 정답(labels)을 받아 해당 정답 토큰의 로그 확률을 계산합니다.
    """
    # Auto-regressive 모델 특성상, 입력 [A, B, C]에 대해 예측은 [B, C, D]가 되므로 시프트(Shift)합니다.
    # TODO: 자동회귀 시프트 인덱스를 채우세요.
    # 힌트: labels는 1칸 앞당기고 logits는 마지막 시점을 제외해 정렬합니다.
    labels = 【빈칸 1】.clone()
    logits = logits[:, :-1, :]

    log_probs = F.log_softmax(logits, dim=-1)

    # 실제 정답 레이블에 해당하는 확률값만 추출 (gather 사용)
    # TODO: gather의 input 텐서를 채우세요.
    # 힌트: raw logits가 아닌 log_probs에서 정답 위치를 gather해야 합니다.
    selected_log_probs = 【빈칸 2】(
        input=log_probs,
        dim=-1,
        index=labels.unsqueeze(-1)
    ).squeeze(-1)

    if selection_mask is not None:
        # 마스크도 시프트하여 적용 (패딩이나 프롬프트 영역 무시)
        mask = selection_mask[:, 1:].clone()
        selected_log_probs = selected_log_probs * mask

        # 유효한 토큰들의 로그 확률 평균 계산
        avg_log_prob = selected_log_probs.sum(-1) / mask.sum(-1)
        return avg_log_prob
    else:
        return selected_log_probs.mean(-1)

def compute_dpo_loss(model_chosen_logprobs, model_rejected_logprobs,
                     reference_chosen_logprobs, reference_rejected_logprobs, beta=0.1):
    """
    DPO 손실 함수 계산:
    Policy 모델이 Reference 모델보다 'chosen' 답변을 더 선호하고, 'rejected' 답변을 덜 선호하도록 유도합니다.

    beta: Reference 모델에서 얼마나 벗어날지 제어하는 하이퍼파라미터 (보통 0.1~0.5)
    """
    # 모델의 (Chosen - Rejected) 로그 확률 차이
    # TODO: 정책 모델 chosen 로그확률 변수를 채우세요.
    # 힌트: chosen - rejected 순서로 빼야 preference 방향이 맞습니다.
    model_logratios = model_chosen_logprobs - model_rejected_logprobs
    # 기준 모델의 (Chosen - Rejected) 로그 확률 차이
    # TODO: 레퍼런스 모델 chosen 로그확률 변수를 채우세요.
    # 힌트: reference도 chosen - rejected 순서를 동일하게 유지합니다.
    reference_logratios = reference_chosen_logprobs - reference_rejected_logprobs

    # 두 비율의 차이 (Policy가 Reference보다 얼마나 더 잘 구분했는가)
    # TODO: DPO logits 차감 대상을 채우세요.
    # 힌트: policy 비율에서 reference 비율을 빼는 형태입니다.
    logits = model_logratios - reference_logratios

    # Sigmoid 후 음수 로그 (Cross Entropy와 유사) -> 이 값을 최소화하면 선호도 차이가 극대화됨
    # TODO: DPO 손실 함수명을 채우세요.
    # 힌트: beta * logits에 logsigmoid를 적용해 손실을 계산합니다.
    losses = -【빈칸 3】(beta * logits)

    # 학습 추적용 보상(Reward) 계산 (실제 학습엔 안 쓰이고 로깅용)
    chosen_rewards = (model_chosen_logprobs - reference_chosen_logprobs).detach()
    rejected_rewards = (model_rejected_logprobs - reference_rejected_logprobs).detach()

    return losses.mean(), chosen_rewards.mean(), rejected_rewards.mean()

def compute_dpo_loss_batch(batch, policy_model, reference_model, beta):
    """
    하나의 배치에 대해 전체 DPO 과정을 수행하는 헬퍼 함수
    """
    # 1. 학습 중인 모델(Policy Model)의 로그 확률 계산 (기울기 계산 O)
    policy_chosen_log_probas = compute_logprobs(
        logits=policy_model(batch["chosen"]),
        labels=batch["chosen"],
        selection_mask=batch["chosen_mask"]
    )
    policy_rejected_log_probas = compute_logprobs(
        logits=policy_model(batch["rejected"]),
        labels=batch["rejected"],
        selection_mask=batch["rejected_mask"]
    )

    # 2. 기준 모델(Reference Model)의 로그 확률 계산 (기울기 계산 X -> 메모리 절약)
    with torch.no_grad():
        ref_chosen_log_probas = compute_logprobs(
            logits=reference_model(batch["chosen"]),
            labels=batch["chosen"],
            selection_mask=batch["chosen_mask"]
        )
        ref_rejected_log_probas = compute_logprobs(
            logits=reference_model(batch["rejected"]),
            labels=batch["rejected"],
            selection_mask=batch["rejected_mask"]
        )

    # 3. 최종 Loss 계산
    loss, chosen_rewards, rejected_rewards = compute_dpo_loss(
        model_chosen_logprobs=policy_chosen_log_probas,
        model_rejected_logprobs=policy_rejected_log_probas,
        reference_chosen_logprobs=ref_chosen_log_probas,
        reference_rejected_logprobs=ref_rejected_log_probas,
        beta=beta
    )
    return loss, chosen_rewards, rejected_rewards

# ==========================================
# 4. 평가 및 학습 루프
# 실제 모델 학습을 돌리는 메인 루프입니다.
# ==========================================
def evaluate_dpo_loss_loader(policy_model, reference_model, train_loader, val_loader, beta, eval_iter):
    """
    학습 중간에 모델 성능을 평가(Validation)하는 함수
    """
    policy_model.eval() # 평가 모드 전환 (Dropout 등 비활성화)
    with torch.no_grad():
        # 로더를 순회하며 평균 Loss 계산하는 내부 함수
        def compute_loader_metric(loader):
            total_loss, total_chosen, total_rejected = 0., 0., 0.
            num_batches = min(eval_iter, len(loader))
            if num_batches == 0: return float("nan"), float("nan"), float("nan")

            for i, batch in enumerate(loader):
                if i >= num_batches: break
                loss, chosen, rejected = compute_dpo_loss_batch(batch, policy_model, reference_model, beta)
                total_loss += loss.item()
                total_chosen += chosen.item()
                total_rejected += rejected.item()
            return total_loss/num_batches, total_chosen/num_batches, total_rejected/num_batches

        train_loss, train_chosen, train_rejected = compute_loader_metric(train_loader)
        val_loss, val_chosen, val_rejected = compute_loader_metric(val_loader)

    policy_model.train() # 다시 학습 모드로 전환
    return {
        "train_loss": train_loss,
        "train_chosen_reward": train_chosen,
        "train_rejected_reward": train_rejected,
        "val_loss": val_loss,
        "val_chosen_reward": val_chosen,
        "val_rejected_reward": val_rejected
    }

def train_model_dpo_simple(policy_model, reference_model, train_loader, val_loader,
                           optimizer, num_epochs, beta, eval_freq, eval_iter, start_context, tokenizer):
    """
    전체 학습 과정을 관리하는 함수
    """
    tracking = {"train_losses": [], "val_losses": [], "tokens_seen": []}
    tokens_seen, global_step = 0, -1

    for epoch in range(num_epochs):
        policy_model.train() # 학습 모드 시작
        for batch in train_loader:
            optimizer.zero_grad() # 이전 기울기 초기화

            # Loss 계산
            loss, chosen_rewards, rejected_rewards = compute_dpo_loss_batch(
                batch=batch, policy_model=policy_model, reference_model=reference_model, beta=beta
            )

            loss.backward() # 역전파 (기울기 계산)
            optimizer.step() # 가중치 업데이트

            tokens_seen += batch["chosen"].numel()
            global_step += 1

            # 평가 주기마다 성능 측정 및 출력
            if global_step % eval_freq == 0:
                res = evaluate_dpo_loss_loader(
                    policy_model, reference_model, train_loader, val_loader, beta, eval_iter
                )
                tracking["train_losses"].append(res["train_loss"])
                tracking["val_losses"].append(res["val_loss"])
                tracking["tokens_seen"].append(tokens_seen)

                # Margin = Chosen Reward - Rejected Reward (클수록 좋음, 모델이 정답을 오답보다 더 선호한다는 뜻)
                print(f"Ep {epoch+1} (Step {global_step:06d}): "
                      f"Train loss {res['train_loss']:.3f}, Val loss {res['val_loss']:.3f}, "
                      f"Train Margin {res['train_chosen_reward']-res['train_rejected_reward']:.3f}")

        # 에포크가 끝날 때마다 샘플 생성하여 육안으로 확인
        generate_and_print_sample(model=policy_model, tokenizer=tokenizer, device=loss.device, start_context=start_context)

    return tracking
```

## LLM — 빈칸 4, 5

출처: llm_from_scratch/Chapter_6_Finetuning_for_Text_Classification_LoRA_KR.ipynb · 셀 29

- **4번 · LoRA A**: A: (in_dim, rank). torch.empty로 해당 shape의 텐서를 만드는 호출식 전체를 작성하세요.
- **5번 · LoRA B**: B: (rank, out_dim). 초기 보정 출력을 0으로 만들도록 torch.zeros 호출식 전체를 작성하세요.

```python
import math
import torch

class LoRALayer(torch.nn.Module):
    def __init__(self, in_dim, out_dim, rank, alpha):
        """
        LoRA(Low-Rank Adaptation) 레이어 초기화

        Args:
            in_dim: 입력 데이터의 차원 크기 (예: 768)
            out_dim: 출력 데이터의 차원 크기 (예: 768)
            rank: 병목 구간의 크기 (Rank, r). 작을수록 파라미터가 적어짐 (예: 8, 16)
            alpha: 스케일링 상수. 학습된 값의 영향력을 조절함
        """
        super().__init__()

        # 1. 행렬 A (Down-projection)
        # 입력(in_dim)을 작은 차원(rank)으로 압축하는 가중치입니다.
        # 파라미터로 등록하여 학습되도록 합니다.
        self.A = torch.nn.Parameter(【빈칸 4】)

        # A는 무작위 값(Kaiming Uniform)으로 초기화합니다.
        # 이렇게 해야 다양한 특징을 학습할 준비가 됩니다.
        torch.nn.init.kaiming_uniform_(self.A, a=math.sqrt(5))

        # 2. 행렬 B (Up-projection)
        # 압축된 정보(rank)를 다시 원래 출력 차원(out_dim)으로 복원하는 가중치입니다.
        self.B = torch.nn.Parameter(【빈칸 5】)

        # 중요: B는 '0'으로 초기화합니다.
        # 이유: 학습 시작 시점에는 A @ B의 결과가 0이 되어야 합니다.
        # 그래야 LoRA를 붙여도 기존 모델의 원래 출력값에 아무런 영향을 주지 않은 채로 시작할 수 있습니다.

        self.alpha = alpha
        self.rank = rank

    def forward(self, x):
        """
        순전파(Forward) 단계: 입력 x에 대한 LoRA 변화량(Delta)을 계산
        """
        # 1. 행렬 연산 (x @ A @ B)
        # 입력 x를 A와 곱해 차원을 줄이고(압축),
        # 그 결과를 다시 B와 곱해 차원을 늘립니다(복원).
        # 연산 순서: (Batch, in) -> (Batch, rank) -> (Batch, out)

        # 2. 스케일링 (alpha / rank)
        # 학습된 결과에 상수배를 해줍니다.
        # alpha는 강도 조절, rank로 나누는 것은 rank값이 바뀌어도
        # 학습률(Learning Rate)을 크게 수정하지 않기 위한 정규화(Normalization) 과정입니다.
        x = (self.alpha / self.rank) * (x @ self.A @ self.B)

        return x
```

## RAG — 빈칸 6, 7, 8

출처: 4_RAG_framework_evaluation_with_MCP.ipynb · 셀 42

- **6번 · MCP 연결**: BasicMCPClient에 external_mcp_server를 전달하는 객체 생성 호출식 전체를 작성하세요.
- **7번 · MCP 도구 어댑터**: McpToolSpec 객체 생성식. client 인수에 mcp_client를 연결하세요.
- **8번 · 도구 조회**: MCP 서버의 도구 목록을 비동기로 가져오세요. 주변 코드의 변수와 shape를 이용해 현재 빈칸의 실행 코드를 작성하세요.

```python
mcp_client = 【빈칸 6】
mcp_tool = 【빈칸 7】

tools = 【빈칸 8】
print("\n=== Available Tools ===\n")
for tool in tools:
    print(f"🔧 Name       : {tool.metadata.name}")
    print(f"   Description: {tool.metadata.description}\n")
```

## RAG — 빈칸 9, 10

출처: 4_RAG_framework_evaluation_with_MCP.ipynb · 셀 46

- **9번 · Agent 생성**: 가져온 tools와 LLM으로 FunctionAgent를 만드세요. 인수와 설정은 코드에 제공됩니다. 함수·클래스·메서드 또는 지정된 부분만 작성하세요.
- **10번 · Agent 실행 문맥**: Context 객체 생성식. 현재 FunctionAgent 인스턴스 self.agent를 전달하세요.

```python
from llama_index.llms.openai import OpenAI

class KGQueryEngineWithMCP:
    def __init__(self, mcp_tool_spec: McpToolSpec, model: str, llm = None):
        self.llm = llm or OpenAI(model=model, temperature=0)
        self.mcp_tool_spec = mcp_tool_spec
        self.agent: Optional[FunctionAgent] = None
        self.agent_context: Optional[Context] = None

    async def init_agent(self):
        tools = await self.mcp_tool_spec.to_tool_list_async()
        for tool in tools:
            if len(tool.metadata.description) > 1000:
                tool.metadata.description = tool.metadata.description[:1000] + "..."
        self.agent = 【빈칸 9】(
            name="Agent",
            description="An agent that can work with Our Knowledge Graph api.",
            tools=tools,
            llm=self.llm,
            system_prompt=SYSTEM_PROMPT,
        )
        self.agent_context = 【빈칸 10】

    async def query(self, question: str, verbose: bool = False) -> str:
        if self.agent is None or self.agent_context is None:
            raise RuntimeError("Agent not initialized. Call `await init_agent()` first.")

        handler = self.agent.run(question, ctx=self.agent_context)
        async for event in handler.stream_events():
            if verbose and type(event) == ToolCall:
                print(f"Calling tool {event.tool_name} with kwargs {event.tool_kwargs}")
            elif verbose and type(event) == ToolCallResult:
                print(f"Tool {event.tool_name} returned {event.tool_output}")

        response = await handler
        return str(response)

kg_engine = KGQueryEngineWithMCP(mcp_tool, model='gpt-3.5-turbo')
await kg_engine.init_agent()
```

## Data — 빈칸 11, 12

출처: RecSys_GCF_sol.ipynb · 셀 13

- **11번 · Message Passing**: NGCF 수식은 제공됩니다. 원소별 상호작용 src_feat*dst_feat를 투영하는 레이어 멤버를 고르세요.
- **12번 · Message 집계**: 아이템 목적지 인덱스에 edge message를 누적하세요. 주변 코드의 변수와 shape를 이용해 현재 빈칸의 실행 코드를 작성하세요.

```python
class NGCFLayer(nn.Module):
    def __init__(self, input_dim, output_dim, dropout=0.1):
        super().__init__()
        self.W1 = nn.Linear(input_dim, output_dim)
        self.W2 = nn.Linear(input_dim, output_dim)
        # self.dropout = nn.Dropout(dropout)
        self.leaky_relu = nn.LeakyReLU(0.2)

    def forward(self, edge_index, node_features, user_num, item_num):
        '''
        edge_index : 엣지 정보 (src, dst)의 집합.
        node_features: node별 이전 layer에서 생성된 벡터 정보가 담긴 matrix (H^(l-1)) (|V| * d)
        '''

        src, dst = edge_index # src : user, dst : movie

        # calculate node degree
        deg = torch.zeros(node_features.size(0), device=node_features.device)
        # calculate user degree
        deg.index_add_(0, src, torch.ones_like(src, dtype=torch.float))
        # calculate movie degree
        deg.index_add_(0, dst, torch.ones_like(dst, dtype=torch.float))

        # calculate 1/(root(deg(u)) * root(deg(i))) for all edge
        norm = 1.0/torch.sqrt(deg[src]*deg[dst])

        src_feat = node_features[src] # H_u
        dst_feat = node_features[dst] # H_i

        edge_messages_for_src = self.W1(dst_feat) + self.W2(dst_feat*src_feat)
        edge_messages_for_src *= norm.unsqueeze(1)

        edge_messages_for_dst = self.W1(src_feat) + 【빈칸 11】(src_feat*dst_feat)
        edge_messages_for_dst *= norm.unsqueeze(1)

        aggregated_messages = torch.zeros_like(node_features)
        aggregated_messages.index_add(0, src, edge_messages_for_src)
        aggregated_messages[:user_num] += self.W1(node_features[:user_num])

        【빈칸 12】
        aggregated_messages[user_num:] += self.W1(node_features[user_num:])

        aggregated_features = self.leaky_relu(aggregated_messages)

        # engineering approach
        # aggregated_features = self.dropout(aggregated_features)
        return aggregated_features
```

## Data — 빈칸 13

출처: RecSys_GCF_sol.ipynb · 셀 14

- **13번 · Layer 결합**: 모든 layer의 feature를 마지막 차원으로 연결하세요. 주변 코드의 변수와 shape를 이용해 현재 빈칸의 실행 코드를 작성하세요.

```python
class NGCF(nn.Module):
    def __init__(self, num_users, num_items, embedding_dim, layer_dims, dropout=0.1):
        super().__init__()
        self.num_users = num_users
        self.num_items = num_items
        self.embedding_dim = embedding_dim
        self.node_embeddings = nn.Embedding(self.num_users+self.num_items,self.embedding_dim)
        nn.init.xavier_uniform_(self.node_embeddings.weight)

        self.layers = nn.ModuleList([
            NGCFLayer(input_dim=(embedding_dim if i == 0 else layer_dims[i - 1]),
                      output_dim=layer_dims[i], dropout=dropout)
            for i in range(len(layer_dims))
        ])

    def forward(self, edge_index):
        node_features = self.node_embeddings.weight
        layer_outputs = [node_features]
        for layer in self.layers:
            node_features = layer(edge_index, node_features,self.num_users, self.num_items)
            layer_outputs.append(node_features)

        # Hint: NGCF의 final feature(representation)은 layer 별 feature에 대한 concatenated vector
        # Hint: 최종 final feature matrix에는 [feuture_vector for users + feature_vector for items]가 들어있음.

        final_features = 【빈칸 13】
        user_features = final_features[:self.num_users]
        item_features = final_features[self.num_users:]
        return user_features, item_features

    def bpr_loss(self, user_emb, pos_item_emb, neg_item_emb, reg_weight=1e-4):
        pos_scores = torch.sum(user_emb * pos_item_emb, dim=1)
        neg_scores = torch.sum(user_emb * neg_item_emb, dim=1)
        loss = -torch.mean(F.logsigmoid(pos_scores - neg_scores))
        reg_loss = reg_weight * (user_emb.norm(2).pow(2) + pos_item_emb.norm(2).pow(2) \
                                 + neg_item_emb.norm(2).pow(2)) / user_emb.size(0)
        return loss + reg_loss
```

## Data — 빈칸 14

출처: RecSys_NCF.ipynb · 셀 10

- **14번 · Embedding 결합**: 사용자와 영화 embedding을 입력 feature로 연결하세요. 주변 코드의 변수와 shape를 이용해 현재 빈칸의 실행 코드를 작성하세요.

```python
### Embedding layer + NCF layer
# 2-layer(including output layer)

# hidden layer + active layer(RELU) + output
# latent vector dim: 32
# input dim: 64

class Neural_Collaborative_Filtering(nn.Module):
  def __init__(self, n_users, n_movies):
    '''
    n_users = # of users
    n_movies = # of movies
    '''
    super().__init__()
    # convert all users and items into 32-dim learnable latent factors(vectors)
    self.user_embedding = nn.Embedding(n_users, 32)
    self.movie_embedding = nn.Embedding(n_movies, 32)

    # Neural network for rating prediction
    self.fc1 = nn.Linear(64,32) # 64 = user_i embedding + movie_j embedding
    self.relu = nn.ReLU()
    self.fc2= nn.Linear(32,1)

  def forward(self, users, movies, ratings = None):
    user_embedding = self.user_embedding(users)
    movie_embedding = self.movie_embedding(movies)
    input_embedding = 【빈칸 14】

    hidden_feature = self.fc1(input_embedding)
    hidden_feature = self.relu(hidden_feature)

    output = self.fc2(hidden_feature) # output is prediction

    return output
```

## Data — 빈칸 15

출처: RecSys_NCF.ipynb · 셀 18

- **15번 · 평가 Metric**: sklearn으로 실제 평점과 모델 출력의 MSE를 계산하세요. 인수와 설정은 코드에 제공됩니다. 함수·클래스·메서드 또는 지정된 부분만 작성하세요.

```python
from sklearn.metrics import mean_squared_error

model_output_list = []
target_rating_list = []

model.eval()

with torch.no_grad():
  for i, batched_data in enumerate(test_loader):
    model_output = model(batched_data['users'],batched_data['movies'])
    model_output_batch = model_output.cpu().numpy().squeeze(axis=1).tolist()
    model_output_list += (model_output_batch)

    target_rating = batched_data['ratings']
    target_rating_batch = target_rating.cpu().numpy().tolist()
    target_rating_list += target_rating_batch

mse = 【빈칸 15】(target_rating_list, model_output_list)
rms = np.sqrt(mse)
print(f"rms: {rms}")
```

## Vision — 빈칸 16, 17

출처: 01_ResNet18_CIFAR10.ipynb · 셀 5

- **16번 · Data Augmentation**: T.RandomCrop 사용. 출력 크기 32, padding=4인 증강 transform 선언식을 작성하세요.
- **17번 · 학습 이미지 정규화**: T.Normalize 사용. CIFAR10_MEAN과 CIFAR10_STD를 순서대로 전달하는 transform 선언식을 작성하세요.

```python
# CIFAR-10에서 널리 쓰는 normalize 값
CIFAR10_MEAN = (0.4914, 0.4822, 0.4465)  # 채널별 평균(R,G,B)
CIFAR10_STD  = (0.2023, 0.1994, 0.2010)  # 채널별 표준편차(R,G,B)

train_tfms = T.Compose([  # train transform(augmentation 포함)
    【빈칸 16】,  # 32x32를 padding 후 random crop
    T.RandomHorizontalFlip(),  # 좌우 반전
    T.ToTensor(),  # PIL -> torch tensor (C,H,W), 0~1
    【빈칸 17】,  # 정규화, -2.5~2.5
])

test_tfms = T.Compose([  # test transform(augmentation 없음)
    T.ToTensor(),  # 텐서 변환
    T.Normalize(CIFAR10_MEAN, CIFAR10_STD),  # 정규화
])

data_root = './data'  # 데이터 저장 경로
train_set = torchvision.datasets.CIFAR10(root=data_root, train=True, download=True, transform=train_tfms)  # train set
test_set  = torchvision.datasets.CIFAR10(root=data_root, train=False, download=True, transform=test_tfms)  # test set

class_names = train_set.classes  # 클래스 이름 목록
num_classes = len(class_names)  # 클래스 개수(10)
print('classes:', class_names)  # 클래스 출력

# 이미지 사이즈 출력
x0, y0 = train_set[0]  # 한 샘플 로드(이미 transform 적용된 텐서)
print('Sample image tensor shape (C,H,W):', tuple(x0.shape))  # (3,32,32)

batch_size = 256  # 배치 크기
num_workers = min(8, os.cpu_count() or 2)  # dataloader worker 수(환경에 맞게)

train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=True)  # train loader
test_loader  = DataLoader(test_set, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=True)  # test loader

print('Total batch size (train: %d, test: %d)' % (len(train_loader), len(test_loader)))  # 배치 개수 확인
```

## Vision — 빈칸 18, 19

출처: 01_ResNet18_CIFAR10.ipynb · 셀 8

- **18번 · CIFAR Stem**: nn.Conv2d 사용. 입력 3·출력 64 채널, kernel_size=3, stride=1, padding=1, bias=False인 CIFAR stem 선언식을 작성하세요.
- **19번 · MaxPool 제거**: 작은 입력에서 초기 해상도를 보존하도록 기존 maxpool을 대체하세요. 주변 코드의 변수와 shape를 이용해 현재 빈칸의 실행 코드를 작성하세요.

```python
def build_resnet18_for_cifar10(num_classes: int = 10):
    model = models.resnet18(weights=None)  # ImageNet pretrained 없이 ResNet18 생성 (from scratch)
    print("\n" + "="*40)
    print("=== PyTorch model structure (Before) ===")  # 모델 구조 출력
    print("="*40 + "\n")
    print(model)  # 구조 출력

    model.conv1 = 【빈칸 18】  # CIFAR용 stem
    model.maxpool = 【빈칸 19】  # maxpool 제거
    model.fc = nn.Linear(model.fc.in_features, num_classes)  # 최종 분류기 출력=10
    return model

model = build_resnet18_for_cifar10(num_classes).to(device)  # 모델 생성 후 device 이동

print("\n" + "="*40)
print("=== PyTorch model structure (After) ===")  # 모델 구조 출력
print("="*40 + "\n")
print(model)  # 구조 출력

num_params = sum(p.numel() for p in model.parameters())  # 파라미터 개수
print(f'params: {num_params:,}')  # 출력
```

## Vision — 빈칸 20

출처: 01_ResNet18_CIFAR10.ipynb · 셀 10

- **20번 · 예측 클래스 선택**: (B, C) logits에서 샘플별 최대 점수의 클래스 인덱스를 선택하세요. 주변 코드의 변수와 shape를 이용해 현재 빈칸의 실행 코드를 작성하세요.

```python
from dataclasses import dataclass  # 설정을 깔끔하게 묶기 위한 dataclass

@dataclass
class TrainConfig:
    base_epochs_if_new: int = 20  # 처음 실험 시 epoch 수
    extra_epochs_if_resume: int = 10  # 체크포인트 존재 시 추가 실험 epoch 수
    lr: float = 0.1  # learning rate
    weight_decay: float = 5e-4  # L2 정규화
    momentum: float = 0.9  # SGD momentum
    label_smoothing: float = 0.0  # 필요 시 label smoothing, 예) [0, 1, 0] ->  [0.05, 0.9, 0.05]

cfg = TrainConfig()  # config 인스턴스 생성

def accuracy_top1(logits, targets):
    preds = 【빈칸 20】  # 가장 큰 logit의 클래스 선택, logits = [B, C], preds = [B]
    return (preds == targets).float().mean().item()  # top-1 accuracy, scalar

scaler = torch.amp.GradScaler(enabled=torch.cuda.is_available())  # AMP용 scaler, 학습 속도를 높이고 메모리 사용량을 줄임
print(scaler)

def train_one_epoch(model, loader, optimizer, criterion):
    model.train()  # train mode(dropout/bn 동작 변경)
    total_loss, total_acc = 0.0, 0.0  # 누적 loss/acc
    n = 0  # 샘플 수 누적
    t0 = time.time()  # 시간 측정 시작
    for images, labels in loader:
        images = images.to(device, non_blocking=True)  # 입력을 GPU로 이동 (Asynchronous transfer)
        labels = labels.to(device, non_blocking=True)  # 라벨을 GPU로 이동 (Asynchronous transfer)

        optimizer.zero_grad(set_to_none=True)  # gradient 초기화
        with torch.amp.autocast(device_type=device.type, enabled=torch.cuda.is_available()):  # AMP autocast
            logits = model(images)  # forward
            loss = criterion(logits, labels)  # loss 계산
        scaler.scale(loss).backward()  # scaled backward
        scaler.step(optimizer)  # optimizer step
        scaler.update()  # scaler 업데이트

        bs = images.size(0)  # batch size
        total_loss += loss.item() * bs  # batch loss 누적
        total_acc  += accuracy_top1(logits.detach(), labels) * bs  # logits값만 복사, batch acc 누적
        n += bs  # 샘플 수 누적

    dt = time.time() - t0  # epoch 수행 시간
    return total_loss / n, total_acc / n, dt  # 평균 loss/acc/시간

@torch.no_grad()   # Autograd off, 함수 내부에서 기울기 계산 멈춤
def evaluate(model, loader, criterion):
    model.eval()  # eval mode, i.e., Dropout 비활성화, BN Running Stats 고정
    total_loss, total_acc = 0.0, 0.0  # 누적
    n = 0  # 샘플 수
    for images, labels in loader:
        images = images.to(device, non_blocking=True)  # GPU 이동
        labels = labels.to(device, non_blocking=True)  # GPU 이동
        logits = model(images)  # forward
        loss = criterion(logits, labels)  # loss
        bs = images.size(0)  # batch size
        total_loss += loss.item() * bs  # 누적
        total_acc  += accuracy_top1(logits, labels) * bs  # 누적
        n += bs  # 누적
    return total_loss / n, total_acc / n  # 평균 loss/acc

def plot_history(hist):
    epochs = np.arange(1, len(hist['train_loss'])+1)  # epoch index
    plt.figure(figsize=(12,4))
    plt.plot(epochs, hist['train_loss'], label='train_loss')  # train loss
    plt.plot(epochs, hist['val_loss'], label='val_loss')  # val loss
    plt.xlabel('epoch'); plt.ylabel('loss'); plt.legend(); plt.grid(True)
    plt.show()

    plt.figure(figsize=(12,4))
    plt.plot(epochs, hist['train_acc'], label='train_acc')  # train acc
    plt.plot(epochs, hist['val_acc'], label='val_acc')  # val acc
    plt.xlabel('epoch'); plt.ylabel('acc'); plt.legend(); plt.grid(True)
    plt.show()
```

## On-device — 빈칸 21

출처: 2. Quantization for CNN_answer.ipynb · 셀 24

- **21번 · Linear Quantization**: 스케일된 텐서를 원소별 가장 가까운 정수값으로 반올림하는 PyTorch 함수입니다.

```python
def linear_quantize(fp_tensor, bitwidth, scale, zero_point, dtype=torch.int8) -> torch.Tensor:
    """
    linear quantization for single fp_tensor
      from
        fp_tensor = (quantized_tensor - zero_point) * scale
      we have,
        quantized_tensor = int(round(fp_tensor / scale)) + zero_point
    :param tensor: [torch.(cuda.)FloatTensor] floating tensor to be quantized
    :param bitwidth: [int] quantization bit width
    :param scale: [torch.(cuda.)FloatTensor] scaling factor
    :param zero_point: [torch.(cuda.)IntTensor] the desired centroid of tensor values
    :return:
        [torch.(cuda.)FloatTensor] quantized tensor whose values are integers
    """
    assert(fp_tensor.dtype == torch.float)
    assert(isinstance(scale, float) or
           (scale.dtype == torch.float and scale.dim() == fp_tensor.dim()))
    assert(isinstance(zero_point, int) or
           (zero_point.dtype == dtype and zero_point.dim() == fp_tensor.dim()))

    # Step 1: fp_tensor를 scale 하세요.
    scaled_tensor = fp_tensor/scale
    # Step 2: 부동 소수점 값을 정수 값으로 rounding 하세요.
    rounded_tensor = 【빈칸 21】(scaled_tensor)

    rounded_tensor = rounded_tensor.to(dtype)

    # Step 3: rounded_tensor를 zero_point 만큼 shift하여 영점을 조정합니다.
    shifted_tensor = rounded_tensor + zero_point

    # Step 4: shifted_tensor를 bitwidth 범위에 있도록 절사(clamp)합니다.
    quantized_min, quantized_max = get_quantized_range(bitwidth)
    quantized_tensor = shifted_tensor.clamp_(quantized_min, quantized_max)
    return quantized_tensor
```

## On-device — 빈칸 22

출처: 2. Quantization for CNN_answer.ipynb · 셀 33

- **22번 · Zero Point**: zero point 수식은 제공됩니다. Python 정수 반올림 함수를 작성하세요.

```python
def get_quantization_scale_and_zero_point(fp_tensor, bitwidth):
    """
    get quantization scale for single tensor
    :param fp_tensor: [torch.(cuda.)Tensor] floating tensor to be quantized
    :param bitwidth: [int] quantization bit width
    :return:
        [float] scale
        [int] zero_point
    """
    quantized_min, quantized_max = get_quantized_range(bitwidth)
    fp_max = fp_tensor.max().item()
    fp_min = fp_tensor.min().item()

    # hint: quantized_max - quantized_min = 2 ** bitwith - 1
    scale = (fp_max - fp_min) / (quantized_max - quantized_min)
    zero_point = 【빈칸 22】(quantized_min - fp_min/scale)

    # clip the zero_point to fall in [quantized_min, quantized_max]
    if zero_point < quantized_min:
        zero_point = quantized_min
    elif zero_point > quantized_max:
        zero_point = quantized_max
    else: # convert from float to int using round()
        zero_point = round(zero_point)
    return scale, int(zero_point)
```

## On-device — 빈칸 23, 24

출처: On-Device/실습/2. Quantization for CNN_answer.ipynb · 셀 64

- **23번 · 채널별 scale broadcast**: weight_scale을 flatten한 뒤 (1,OC,1,1)로 만들고 output을 float로 바꾸는 두 줄을 쓰세요.
- **24번 · CNN 반올림·범위 제한**: round → get_quantized_range로 clamp → int8 변환 순서로 output을 갱신하세요. feature_bitwidth=8이며 get_quantized_range는 signed 정수 범위를 반환합니다.

```python
# 앞 단계에서 Conv 누적 + shifted_bias까지 계산한 output
【빈칸 23】
output = output * (input_scale * weight_scale / output_scale)
output = output + output_zero_point
【빈칸 24】
```

## On-device — 빈칸 25

출처: On-Device/실습/5. Quantization for LLM_answer.ipynb · 셀 18

- **25번 · LLM 양자화와 복원**: w/scale 반올림 후 zero point를 더해 [0,max_int]로 clamp하고, 다음 줄에서 실수로 복원하세요. 제공식: q=clamp(round(w/scales)+zeros, 0, max_int), 복원값=(q-zeros)*scales.

```python
max_int = 2 ** n_bit - 1
scales = (max_val - min_val).clamp(min=1e-5) / max_int
zeros = (-torch.round(min_val / scales)).clamp_(0, max_int)
【빈칸 25】
# 그룹화했다면 마지막에 원래 shape로 복원
w = w.reshape(org_w_shape)
```

## 답안란

1. ____________________

2. ____________________

3. ____________________

4. ____________________

5. ____________________

6. ____________________

7. ____________________

8. ____________________

9. ____________________

10. ____________________

11. ____________________

12. ____________________

13. ____________________

14. ____________________

15. ____________________

16. ____________________

17. ____________________

18. ____________________

19. ____________________

20. ____________________

21. ____________________

22. ____________________

23. ____________________

24. ____________________

25. ____________________
