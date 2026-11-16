# 11월 대비 모의고사 1회 — 먼저 준비할 후보

범위: MHA·GPT / 기본 RAG / Sliding window·Encoder–Decoder / Attention·Residual / Kernel·Channel pruning

권장 60분 · 25빈칸 · 빈칸당 4점 · 총 100점. 시간과 배점은 연습용입니다.

복기에서 고른 대비 후보이며 실제 11월 출제나 확률을 검증한 자료가 아닙니다. 2회는 보완 범위이며 난이도 순서가 아닙니다.

## 응시 방법

- 【빈칸 번호】에 들어갈 코드만 답안란에 작성하세요. 여러 줄이 필요한 빈칸도 있습니다.
- 같은 셀의 출제 빈칸은 동시에 가렸으며, 나머지 코드는 제공합니다. 전체 셀을 읽고 답하세요.
- 강의 셀의 import·데이터·앞선 셀의 정의는 준비됐다고 가정합니다. 셀을 독립 실행하는 시험은 아닙니다.
- 학습용 힌트 없이 제공된 코드의 흐름에 맞게 작성하세요. 강의 API 기준이며 서버 연결은 필요하지 않습니다.
- 풀 때 정답 파일은 열지 마세요. 답안란은 문서 하단에 있습니다.

## LLM — 빈칸 1, 2

출처: Chapter_3_Attention_Mechanisms_KR.ipynb · 셀 136

- **1번 · MHA keys 헤드 분리**
- **2번 · MHA 헤드 축 이동**

```python
import torch
import torch.nn as nn

class MultiHeadAttention(nn.Module):
    def __init__(self, d_in, d_out, context_length, dropout, num_heads, qkv_bias=False):
        super().__init__()
        # [검증] 전체 출력 차원(d_out)은 헤드 개수(num_heads)로 나누어 떨어져야 합니다.
        # 예: d_out=768, num_heads=12 -> 각 헤드는 64차원을 담당
        assert (d_out % num_heads == 0), "d_out must be divisible by num_heads"

        self.d_out = d_out
        self.num_heads = num_heads
        self.head_dim = d_out // num_heads  # 각 헤드가 담당할 차원 크기

        # [입력 투영] Q, K, V를 만들기 위한 선형 레이어
        # 참고: 헤드별로 레이어를 따로 만들지 않고, 한번에 큰 차원(d_out)으로 변환 후 나중에 쪼갭니다 (효율성)
        self.W_query = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.W_key = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.W_value = nn.Linear(d_in, d_out, bias=qkv_bias)

        # [출력 투영] 여러 헤드의 결과를 다시 하나로 섞어주는 레이어
        self.out_proj = nn.Linear(d_out, d_out)
        self.dropout = nn.Dropout(dropout)

        # [마스크 등록] 학습 파라미터가 아니므로 register_buffer 사용
        # 대각선 위쪽(미래 정보)을 1로 채운 상삼각 행렬 생성
        self.register_buffer(
            "mask",
            torch.triu(torch.ones(context_length, context_length), diagonal=1)
        )

    def forward(self, x):
        # b: 배치 크기, num_tokens: 문장 길이(T), d_in: 입력 차원
        b, num_tokens, d_in = x.shape

        # 1. [선형 변환] 입력 x를 Q, K, V로 변환
        # Shape: (b, num_tokens, d_out)
        keys = self.W_key(x)
        queries = self.W_query(x)
        values = self.W_value(x)

        # 2. [헤드 분할] d_out 차원을 (num_heads, head_dim)으로 쪼갭니다.
        # Shape 변환: (b, num_tokens, d_out) -> (b, num_tokens, num_heads, head_dim)
        keys = 【빈칸 1】
        values = values.view(b, num_tokens, self.num_heads, self.head_dim)
        queries = queries.view(b, num_tokens, self.num_heads, self.head_dim)

        # 3. [차원 변경] 병렬 연산을 위해 '헤드' 차원을 '문장 길이' 앞으로 옮깁니다.
        # 이렇게 하면 (b, num_heads)를 마치 하나의 배치처럼 묶어서 행렬 곱셈을 한 번에 처리할 수 있습니다.
        #Shape 변환: (b, num_tokens, num_heads, head_dim) -> (b, num_heads, num_tokens, head_dim)
        keys = 【빈칸 2】
        queries = queries.transpose(1, 2)
        values = values.transpose(1, 2)

        # 4. [어텐션 스코어 계산] (Query @ Key_Transposed)
        # 행렬 곱셈: (b, h, T, head_dim) @ (b, h, head_dim, T) -> (b, h, T, T)
        # 결과값은 각 토큰끼리의 연관도(유사도)를 나타냅니다.
        attn_scores = queries @ keys.transpose(2, 3)

        # 5. [마스킹] 미래의 단어를 보지 못하게 가림 (Causal Masking)
        # 현재 시퀀스 길이에 맞춰 마스크를 자르고, 값이 1인 곳(미래)을 -무한대로 채움
        mask_bool = self.mask.bool()[:num_tokens, :num_tokens]
        attn_scores.masked_fill_(mask_bool, -torch.inf)

        # 6. [확률 변환] Softmax로 점수를 확률값(0~1)으로 변환
        # 스케일링(Scaling): head_dim의 제곱근으로 나누어 기울기 소실 방지
        attn_weights = torch.softmax(attn_scores / keys.shape[-1]**0.5, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # 7. [컨텍스트 벡터 계산] (Attention_Weights @ Values)
        # 가중치가 적용된 정보의 합을 구함
        # Shape: (b, h, T, T) @ (b, h, T, head_dim) -> (b, h, T, head_dim)
        context_vec = (attn_weights @ values).transpose(1, 2)

        # 8. [헤드 결합] 쪼개졌던 헤드들을 다시 하나로 이어 붙임 (Concatenate)
        # transpose로 인해 메모리가 섞인 것을 contiguous로 정렬 후, view로 합침
        # Shape 변환: (b, T, h, head_dim) -> (b, T, d_out)
        context_vec = context_vec.contiguous().view(b, num_tokens, self.d_out)

        # 9. [최종 출력] 마지막 선형 변환
        context_vec = self.out_proj(context_vec)

        return context_vec

# --- 테스트 코드 ---
torch.manual_seed(123)

batch_size, context_length, d_in = batch.shape
d_out = 4 # 최종 출력 차원
mha = MultiHeadAttention(d_in, d_out, context_length, 0.0, num_heads=2)

context_vecs = mha(batch)

print("출력 값:\n", context_vecs)
print("출력 크기:", context_vecs.shape)
# 예상 출력 크기: torch.Size([2, 10, 4]) -> (배치, 문장길이, d_out)
```

## LLM — 빈칸 3

출처: llm_from_scratch/images/Chapter_4_Excercise_GPT.ipynb · 셀 3

- **3번 · 출력 헤드**

```python
##중요 : 아래는 GPT 모델 전체 구조를 정의하는 코드입니다

#####################################
# Chapter 4: GPT 아키텍처 조립
#####################################

class GPTModel(nn.Module):
    """
    전체 GPT 모델 구조 정의
    Embedding -> Transformer Blocks -> Final Norm -> Output Head
    """
    def __init__(self, cfg):
        super().__init__()
        # 토큰 임베딩 (단어 -> 벡터)
        self.tok_emb = nn.Embedding(cfg["vocab_size"], cfg["emb_dim"])
        # 위치 임베딩 (위치 정보 -> 벡터)
        self.pos_emb = nn.Embedding(cfg["context_length"], cfg["emb_dim"])
        self.drop_emb = nn.Dropout(cfg["drop_rate"])

        # 트랜스포머 블록 쌓기 (n_layers 만큼)
        self.trf_blocks = nn.Sequential(
            *[TransformerBlock(cfg) for _ in range(cfg["n_layers"])])

        # 최종 정규화 및 출력 헤드
        self.final_norm = LayerNorm(cfg["emb_dim"])
        self.out_head = 【빈칸 3】

    def forward(self, in_idx):
        batch_size, seq_len = in_idx.shape

        # 1. 임베딩 생성
        tok_embeds = self.tok_emb(in_idx)
        pos_embeds = self.pos_emb(torch.arange(seq_len, device=in_idx.device))

        # 2. 토큰 임베딩과 위치 임베딩 합산
        x = tok_embeds + pos_embeds
        x = self.drop_emb(x)

        # 3. 트랜스포머 블록 통과
        x = self.trf_blocks(x)

        # 4. 최종 출력 계산
        x = self.final_norm(x)
        logits = self.out_head(x) # 각 단어에 대한 예측 점수 (Logits)

        return logits
```

## LLM — 빈칸 4, 5

출처: llm_from_scratch/images/Chapter_4_Excercise_GPT.ipynb · 셀 4

- **4번 · 마지막 시점**
- **5번 · Greedy Decoding**

```python
def generate_text_simple(model, idx, max_new_tokens, context_size):
    """
    간단한 텍스트 생성 루프
    현재 문맥을 넣어 다음 토큰을 예측하고, 이를 다시 문맥에 추가하여 반복함
    """
    # idx: 현재 문맥의 토큰 인덱스들 (Batch, Time)
    for _ in range(max_new_tokens):

        # 모델이 지원하는 최대 길이(context_size)를 넘지 않도록 자름
        idx_cond = idx[:, -context_size:]

        # 모델 예측 (기울기 계산 불필요)
        with torch.no_grad():
            logits = model(idx_cond)

        # 마지막 타임스텝의 예측값만 가져옴 (다음 단어 예측이므로)
        # (batch, n_token, vocab_size) -> (batch, vocab_size)
        logits = 【빈칸 4】

        # 가장 확률(로짓값)이 높은 토큰 선택 (Greedy Decoding)
        idx_next = 【빈칸 5】

        # 예측된 토큰을 현재 시퀀스 뒤에 이어 붙임
        idx = torch.cat((idx, idx_next), dim=1)

    return idx
```

## RAG — 빈칸 6

출처: 1. Llama_index.ipynb · 셀 15

- **6번 · 인덱스 생성**

```python
index = 【빈칸 6】
```

## RAG — 빈칸 7

출처: 1. Llama_index.ipynb · 셀 32

- **7번 · Query Engine 구성**

```python
query_engine = 【빈칸 7】
```

## RAG — 빈칸 8

출처: 2. Task_1.ipynb · 셀 16

- **8번 · Top-k 검색**

```python
from llama_index.core.schema import Document
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core import VectorStoreIndex, Settings
from llama_index.embeddings.openai import OpenAIEmbedding

Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

class LlamaIndexRetriever:
  def __init__(self):
      self.parser = SentenceSplitter(chunk_size=512, chunk_overlap=0)

  def retrieve(self, query, search_results, topk):
      documents = []

      for document in parse_htmls(search_results):
        if not document:
            # If no text is extracted, add an empty string as a placeholder.
            documents.append(Document(text=""))
        else:
            documents.append(Document(text=document))

      # Split documents into chunks & Create vector index
      base_index = VectorStoreIndex.from_documents(documents = documents, transformations=[self.parser])

      # Execute query
      base_retriever = 【빈칸 8】

      retrieved_nodes = base_retriever.retrieve(query)

      retrieved_results = [retrieved_node.node.get_content().strip() for retrieved_node in retrieved_nodes]

      return retrieved_results
```

## RAG — 빈칸 9

출처: 2. Task_1.ipynb · 셀 23

- **9번 · 질문과 근거 메시지**

```python
def prompt_generator(query, top_k_chunks, system_prompt):
    user_message = ""
    references = ""

    if len(top_k_chunks) > 0:
        references += "# References \n"
        # Format the top sentences as references in the model's prompt template.
        for chunk_id, chunk in enumerate(top_k_chunks):
            references += f"- {chunk.strip()}\n"

    references = references[:MAX_CONTEXT_REFERENCES_LENGTH]
    # Limit the length of references to fit the model's input size.

    user_message += f"{references}\n------\n\n"
    user_message += f"Using only the references listed above, answer the following question: \n"
    user_message += f"Question: {query}\n"

    llm_input = [
      {"role": "system", "content": system_prompt},
      【빈칸 9】,
    ]

    return llm_input
```

## RAG — 빈칸 10

출처: 2. Task_1.ipynb · 셀 29

- **10번 · 검색에서 생성으로**

```python
class RAG:
    def __init__(self):
        self.retriever = LlamaIndexRetriever()
        self.reader = Reader()

    def inference(self, query, search_results, topk):
        # 1. retrieve relevant chunks
        retrieved_results = self.retriever.retrieve(query, search_results, topk)

        # 2. answer the question based on the retrieved chunks
        answer = 【빈칸 10】

        return answer, retrieved_results
```

## Data — 빈칸 11, 12

출처: ts_solution.ipynb · 셀 41

- **11번 · Encoder 입력 구간**
- **12번 · Decoder 정답 구간**

```python
sequence_length = 50
target_len = 10

def create_enc_dec_sequences(data):
    features, labels = [], []
    for i in range(len(data) - sequence_length - target_len):
        features.append(【빈칸 11】)
        labels.append(【빈칸 12】)

    features = np.array(features, dtype=np.float32)
    labels = np.array(labels, dtype=np.float32)

    features = torch.tensor(features, dtype=torch.float32)
    labels = torch.tensor(labels, dtype=torch.float32)
    return features, labels

X_train_, y_train_ = create_enc_dec_sequences(train_scaled)
X_test_, y_test_ = create_enc_dec_sequences(test_scaled)
print(X_train_.shape)
print(y_train_.shape)
print(X_test_.shape)
print(y_test_.shape)

train_loader_ = to_loader(X_train_, y_train_, batch_size, shuffle=True)
test_loader_ = to_loader(X_test_, y_test_, batch_size, shuffle=False)
```

## Data — 빈칸 13, 14, 15

출처: ts_solution.ipynb · 셀 43

- **13번 · Decoder 초기 입력**
- **14번 · 예측을 다음 입력으로**
- **15번 · 예측 시간 축 생성**

```python
class EncoderRNN(nn.Module):
  def __init__(self, input_size, hidden_size, num_layers):
    super(EncoderRNN, self).__init__()
    self.rnn = nn.RNN(input_size, hidden_size, num_layers, batch_first=True)

  def forward(self, x):
    _, h = self.rnn(x)
    return h

class DecoderRNN(nn.Module):
  def __init__(self, input_size, hidden_size, num_layers):
    super(DecoderRNN, self).__init__()
    self.rnn = nn.RNN(input_size, hidden_size, num_layers, batch_first=True)
    self.fc = nn.Linear(hidden_size, input_size)

  def forward(self, x, h):
    out, h = self.rnn(x, h)
    out = self.fc(out)
    return out, h

class RNNRNN(nn.Module):
  def __init__(self, input_size, hidden_size, num_layers):
    super(RNNRNN, self).__init__()
    self.encoder = EncoderRNN(input_size, hidden_size, num_layers)
    self.decoder = DecoderRNN(input_size, hidden_size, num_layers)

  def forward(self, source, target_len):
    h = self.encoder(source)
    predictions = []
    input = 【빈칸 13】
    for t in range(target_len):
      out, h = self.decoder(input, h)
      predictions.append(out.squeeze(1))
      【빈칸 14】
    outputs = 【빈칸 15】

    return outputs

model_ = RNNRNN(input_size, hidden_size, num_layers).to(device)
print(model_)

# RNNRNN(
#   (encoder): EncoderRNN(
#     (rnn): RNN(1, 64, num_layers=2, batch_first=True)
#   )
#   (decoder): DecoderRNN(
#     (rnn): RNN(1, 64, num_layers=2, batch_first=True)
#     (fc): Linear(in_features=64, out_features=1, bias=True)
#   )
# )
```

## Vision — 빈칸 16, 17, 18, 19, 20

출처: 02_ViT_CIFAR10.ipynb · 셀 8

- **16번 · QKV Projection**
- **17번 · Scaled Dot-product**
- **18번 · Attention Value 가중합**
- **19번 · Attention Residual**
- **20번 · FFN Residual**

```python
def pair(t):  # image_size/patch_size를 (H,W) 형태로 통일하는 유틸
    return t if isinstance(t, tuple) else (t, t)


class PreNorm(nn.Module):  # Transformer의 Pre-LN 구조: LayerNorm 후 블록 실행
    def __init__(self, dim, fn):
        super().__init__()
        self.norm = nn.LayerNorm(dim)  # 토큰 임베딩 차원(dim) 기준 LayerNorm -> 패치별 정규화
        self.fn = fn
    def forward(self, x, **kwargs):
        return self.fn(self.norm(x), **kwargs)  # 정규화된 토큰을 Attention/FFN에 전달

class FeedForward(nn.Module):  # Transformer의 FFN(MLP) 블록 -> 패치 자체의 정보를 더 깊게 분석
    def __init__(self, dim, hidden_dim, dropout = 0.):
        super().__init__()
        self.net = nn.Sequential(  # FFN: Linear→GELU→Dropout→Linear→Dropout 구성
            nn.Linear(dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, dim),
            nn.Dropout(dropout)
        )
    def forward(self, x):
        return self.net(x)

class Attention(nn.Module):  # 멀티헤드 Self-Attention(MHSA) 구현
    def __init__(self, dim, heads = 4, dim_head = 64, dropout = 0.):
        super().__init__()
        inner_dim = dim_head *  heads  # 전체 헤드 차원 = head 수 × head 차원
        project_out = not (heads == 1 and dim_head == dim)

        self.heads = heads  # 멀티헤드 개수 저장
        self.scale = dim_head ** -0.5  # Scaled dot-product를 위한 스케일(1/√d)

        self.attend = nn.Softmax(dim = -1)  # attention score를 확률로 변환(softmax), 마지막 차원 : sequence length N
        self.last_attn = None  # (학습/추론 시) 마지막 forward에서의 attention map 저장용(시각화/분석)  # attention score를 확률로 변환(softmax), 마지막 차원 : sequence length N
        self.to_qkv = 【빈칸 16】  # 입력 토큰→Q,K,V를 한 번에 선형 변환

        self.to_out = nn.Sequential(  # 헤드들을 합친 뒤 출력 투영 + 드롭아웃
            nn.Linear(inner_dim, dim),
            nn.Dropout(dropout)
        ) if project_out else nn.Identity()

    def forward(self, x):
        b, n, _, h = *x.shape, self.heads   # x = [batch Size, tokens, embedding dimension]
        qkv = self.to_qkv(x).chunk(3, dim = -1)  # 선형변환 결과를 Q,K,V로 분할 -> (Q, K ,V)
        q, k, v = map(lambda t: rearrange(t, 'b n (h d) -> b h n d', h = h), qkv)  # multi-head 연산을 위해 각 head 기준 n x d 로 분리

        dots = 【빈칸 17】('b h i d, b h j d -> b h i j', q, k) * self.scale  # 각 토큰 간 유사도(Q·Kᵀ) 계산 후 스케일 적용

        attn = self.attend(dots)  # 토큰 간 가중치(attention map) 생성
        self.last_attn = attn.detach()  # 그래프에서 분리(detach)해서 저장 (시각화 목적)

        out = 【빈칸 18】('b h i j, b h j d -> b h i d', attn, v)  # attention 가중합으로 새로운 토큰 표현(out) 계산
        out = rearrange(out, 'b h n d -> b n (h d)')  # 헤드 차원을 다시 합쳐 (batch, tokens, dim)로 복원
        return self.to_out(out)  # 최종 투영을 거쳐 Attention 블록 출력 반환

class Transformer(nn.Module):  # Encoder block을 여러 층(depth) 쌓는 Transformer
    def __init__(self, dim, depth, heads, dim_head, mlp_dim, dropout = 0.):
        super().__init__()
        self.layers = nn.ModuleList([])  # 각 층(Attention+FFN)을 담을 컨테이너
        for _ in range(depth):  # depth 만큼 Encoder block 반복 생성
            self.layers.append(nn.ModuleList([  # 한 층 = (PreNorm+Attention) + (PreNorm+FFN)
                PreNorm(dim, Attention(dim, heads = heads, dim_head = dim_head, dropout = dropout)),
                PreNorm(dim, FeedForward(dim, mlp_dim, dropout = dropout))
            ]))
    def forward(self, x):
        for attn, ff in self.layers:
            x = 【빈칸 19】  # Residual 연결: Attention 결과를 입력에 더해 정보 보존
            x = 【빈칸 20】  # Residual 연결: FFN 결과를 입력에 더해 정보 보존
        return x
```

## On-device — 빈칸 21, 22

출처: 1. Pruning for CNN_answer.ipynb · 셀 33

- **21번 · 커널 중요도 합산**
- **22번 · 커널 Pruning Threshold**

```python
def prune_weight_kernel_level(weight: torch.Tensor, sparsity: float) -> None:
    """커널 단위로 가중치를 프루닝하는 함수

    Args:
        weight: 프루닝할 가중치 텐서 (out_channels, in_channels, kernel_h, kernel_w)
        sparsity: 프루닝할 비율 (0~1 사이 값)

    Returns:
        프루닝 마스크 텐서
    """
    sparsity = min(1.0, max(0.0, sparsity))
    if sparsity == 1.0:
        weight.zero_()
        return torch.zeros_like(weight)
    elif sparsity == 0.0:
        return torch.ones_like(weight)

    # 프루닝할 커널 수 계산
    num_kernels = weight.shape[0] * weight.shape[1]
    num_pruned_kernels = round(num_kernels * sparsity)

    # 각 커널의 중요도를 절댓값 합으로 계산 (커널 크기에 대해 합산)
    importance = 【빈칸 21】

    # pruning trheshold를 계산
    threshold = 【빈칸 22】

    # threshold보다 큰 커널은 유지(1), 작은 커널은 제거(0)
    mask = importance > threshold

    # 마스크를 가중치와 동일한 크기로 확장
    mask = mask.expand_as(weight)

    # 마스크를 적용하여 프루닝 수행
    weight.mul_(mask)

    return mask

mask_kernel_level = prune_weight_kernel_level(weight.clone(), prune_sparsity)
draw_weight_distribution(mask_kernel_level, title="Kernel-level Pruning Mask")
```

## On-device — 빈칸 23, 24, 25

출처: 1. Pruning for CNN_answer.ipynb · 셀 35

- **23번 · 입력 채널 수**
- **24번 · 채널 중요도 합산**
- **25번 · 채널 mask 확장**

```python
def prune_weight_channel_level(weight: torch.Tensor, sparsity: float) -> None:
    """채널 단위 프루닝을 수행하는 함수

    Args:
        weight: 프루닝할 가중치 텐서 (out_channels, in_channels, kernel_h, kernel_w)
        sparsity: 프루닝할 비율 (0~1 사이 값)

    Returns:
        프루닝 마스크 텐서
    """
    sparsity = min(1.0, max(0.0, sparsity))
    if sparsity == 1.0:
        weight.zero_()
        return torch.zeros_like(weight)
    elif sparsity == 0.0:
        return torch.ones_like(weight)

    # 프루닝할 채널 수 계산
    num_channels = 【빈칸 23】
    num_pruned_channels = round(num_channels * sparsity)

    # 각 채널의 중요도를 절댓값 합으로 계산
    # (출력 채널, 커널 높이, 커널 너비에 대해 합산)
    importance = 【빈칸 24】

    # pruning threshold를 계산
    threshold = torch.kthvalue(importance.flatten(), num_pruned_channels)[0]

    # threshold보다 큰 채널은 유지(1), 작은 채널은 제거(0)
    mask = importance > threshold

    # 마스크를 가중치와 동일한 크기로 확장
    mask = 【빈칸 25】

    # 마스크를 적용하여 프루닝 수행
    weight.mul_(mask)

    return mask

mask_channel_level = prune_weight_channel_level(weight.clone(), prune_sparsity)
draw_weight_distribution(mask_channel_level, title="Channel-level Pruning Mask")
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
