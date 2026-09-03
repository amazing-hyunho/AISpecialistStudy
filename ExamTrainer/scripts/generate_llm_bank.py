"""Build the static LLM cloze bank from the course notebooks.

The generated JSON is committed with the site, while the private Study folder
remains outside the deployment. Run this script only when the curated source
list below changes.
"""

from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
LLM_ROOT = REPO_ROOT / "Study" / "LLM"
OUTPUT = REPO_ROOT / "ExamTrainer" / "app" / "question-bank.json"

CHAPTERS = [
    {"id": "llm-01", "number": "01", "title": "Vector Space", "file": "Chapter_1_Exercise_Vector Space.ipynb"},
    {"id": "llm-02", "number": "02", "title": "Dataset & Embeddings", "file": "Chapter_2_Exercise_Dataset.ipynb"},
    {"id": "llm-03a", "number": "03A", "title": "Attention", "file": "Chapter_3_Excercise_Attention.ipynb"},
    {"id": "llm-03b", "number": "03B", "title": "Multi-head Attention Viz", "file": "Chapter_3_Excercise_Viz_Multi_head_attention.ipynb"},
    {"id": "llm-04", "number": "04", "title": "GPT Architecture", "file": "Chapter_4_Excercise_GPT.ipynb"},
    {"id": "llm-05", "number": "05", "title": "Pretraining", "file": "Chapter_5_Excercise_Pretraining.ipynb"},
    {"id": "llm-06a", "number": "06A", "title": "Classification Finetuning", "file": "Chapter_6_Excercise_Finetuning_Classification.ipynb"},
    {"id": "llm-06b", "number": "06B", "title": "LoRA Finetuning", "file": "Chapter_6_Excercise_Finetuning_Classification_LoRA.ipynb"},
    {"id": "llm-07a", "number": "07A", "title": "Instruction Finetuning", "file": "Chapter_7_Exercise_Follow_Instructions.ipynb"},
    {"id": "llm-07b", "number": "07B", "title": "DPO", "file": "Chapter_7_Exercise_Follow_Instructions_dpo.ipynb"},
]

SOURCES = {
    "ch1": "Chapter_1_Exercise_Vector Space.ipynb",
    "ch2": "Chapter_2_Exercise_Dataset.ipynb",
    "ch3": "llm_from_scratch/Chapter_3_Attention_Mechanisms_KR.ipynb",
    "ch3viz": "Chapter_3_Excercise_Viz_Multi_head_attention.ipynb",
    "ch4": "llm_from_scratch/images/Chapter_4_Excercise_GPT.ipynb",
    "ch5": "llm_from_scratch/Chapter_5_Pretraining_on_Unlabeled Data_KR.ipynb",
    "ch6": "llm_from_scratch/Chapter_6_Finetuning_for_Text_Classification_KR.ipynb",
    "ch6lora": "llm_from_scratch/Chapter_6_Finetuning_for_Text_Classification_LoRA_KR.ipynb",
    "ch7": "llm_from_scratch/Chapter_7_Finetuning_to_Follow_Instructions_KR.ipynb",
}

DPO_SOURCE = '''chosen_full_tokens = tokenizer.encode(
    f"{prompt}\\n\\n### Response:\\n{chosen_response}"
)
rejected_full_tokens = tokenizer.encode(
    f"{prompt}\\n\\n### Response:\\n{rejected_response}"
)

labels = labels[:, 1:].clone()
logits = logits[:, :-1, :]
log_probs = F.log_softmax(logits, dim=-1)
selected_log_probs = torch.gather(
    input=log_probs,
    dim=-1,
    index=labels.unsqueeze(-1)
).squeeze(-1)

model_logratios = model_chosen_logprobs - model_rejected_logprobs
reference_logratios = reference_chosen_logprobs - reference_rejected_logprobs
logits = model_logratios - reference_logratios
losses = -F.logsigmoid(beta * logits)'''

SPECS: list[dict[str, str]] = []


def add(
    chapter: str,
    source: str,
    topic: str,
    prompt: str,
    answer: str,
    occurrence: int = 0,
) -> None:
    SPECS.append({
        "chapterId": chapter,
        "sourceKey": source,
        "topic": topic,
        "prompt": prompt,
        "answer": answer,
        "occurrence": occurrence,
    })


# Chapter 1 - Vector Space
add("llm-01", "ch1", "환경 준비", "Gensim 라이브러리를 설치하는 코드를 완성하세요.", "%pip install gensim")
add("llm-01", "ch1", "모델 불러오기", "사전 학습 모델 다운로드 모듈을 api 이름으로 불러오세요.", "import gensim.downloader as api")
add("llm-01", "ch1", "모델 불러오기", "GloVe 사전 학습 모델을 불러오세요.", "api.load(\"glove-wiki-gigaword-50\")")
add("llm-01", "ch1", "코사인 유사도", "cat과 dog의 유사도를 계산하세요.", "model.similarity(word1, word2)")
add("llm-01", "ch1", "코사인 유사도", "cat과 car의 유사도를 계산하세요.", "model.similarity(word1, word3)")
add("llm-01", "ch1", "유사 단어 검색", "가장 유사한 단어 5개를 가져오세요.", "model.most_similar(target_word, topn=5)")
add("llm-01", "ch1", "결과 순회", "유사 단어와 점수를 순회하는 반복문을 완성하세요.", "for word, score in similar_words:")
add("llm-01", "ch1", "이상 단어 찾기", "그룹에 어울리지 않는 단어를 찾으세요.", "model.doesnt_match(word_group)")

# Chapter 2 - explicit exercise blanks
add("llm-02", "ch2", "토큰 인코딩", "특수 토큰을 허용하며 문자열을 토큰 ID로 변환하세요.", "tokenizer.encode(text, allowed_special={\"<|endoftext|>\"})")
add("llm-02", "ch2", "토큰 디코딩", "토큰 ID를 다시 문자열로 복원하세요.", "tokenizer.decode(integers)")
add("llm-02", "ch2", "다음 토큰 예측", "입력보다 한 칸 뒤로 이동한 타깃 시퀀스를 완성하세요.", "enc_sample[1:context_size+1]")
add("llm-02", "ch2", "입력 청크", "현재 위치부터 max_length만큼 입력 청크를 자르세요.", "token_ids[i:i+max_length]")
add("llm-02", "ch2", "타깃 청크", "입력보다 한 칸 뒤의 타깃 청크를 만드세요.", "token_ids[i + 1 : i + max_length + 1]")
add("llm-02", "ch2", "Dataset 규약", "같은 인덱스의 입력과 타깃을 반환하세요.", "self.input_ids[idx], self.target_ids[idx]")
add("llm-02", "ch2", "DataLoader", "DataLoader에 학습 데이터셋을 전달하세요.", "dataset", 1)
add("llm-02", "ch2", "토큰 임베딩", "단어장 크기와 출력 차원으로 임베딩 레이어를 만드세요.", "torch.nn.Embedding(vocab_size, output_dim)")
add("llm-02", "ch2", "토큰 임베딩", "정수 토큰 ID에 임베딩 레이어를 적용하세요.", "embedding_layer(input_ids)")

# Chapter 3A - Causal Attention
add("llm-03a", "ch3", "Q 투영", "Query를 만드는 선형 투영 레이어를 완성하세요.", "self.W_query = nn.Linear(d_in, d_out, bias=qkv_bias)")
add("llm-03a", "ch3", "K 투영", "Key를 만드는 선형 투영 레이어를 완성하세요.", "self.W_key   = nn.Linear(d_in, d_out, bias=qkv_bias)")
add("llm-03a", "ch3", "V 투영", "Value를 만드는 선형 투영 레이어를 완성하세요.", "self.W_value = nn.Linear(d_in, d_out, bias=qkv_bias)")
add("llm-03a", "ch3", "Q·K 계산", "입력에서 Key 벡터를 계산하세요.", "keys = self.W_key(x)")
add("llm-03a", "ch3", "Q·K 계산", "입력에서 Query 벡터를 계산하세요.", "queries = self.W_query(x)")
add("llm-03a", "ch3", "어텐션 스코어", "Query와 전치한 Key의 내적을 계산하세요.", "queries @ keys.transpose(1, 2)")
add("llm-03a", "ch3", "인과적 마스킹", "미래 토큰의 스코어를 음의 무한대로 채우세요.", "-torch.inf")
add("llm-03a", "ch3", "문맥 벡터", "어텐션 가중치와 Value로 문맥 벡터를 계산하세요.", "attn_weights @ values")

# Chapter 3B - Multi-head visualization
add("llm-03b", "ch3viz", "헤드 분리", "Key를 여러 어텐션 헤드로 나누고 차원을 전치하세요.", "keys.view(b, num_tokens, module.num_heads, module.head_dim).transpose(1, 2)")
add("llm-03b", "ch3viz", "헤드별 스코어", "각 헤드에서 Query와 Key의 어텐션 스코어를 계산하세요.", "queries @ keys.transpose(2, 3)")
add("llm-03b", "ch3viz", "Forward Hook", "각 Transformer block의 attention에 hook을 등록하세요.", "block.att.register_forward_hook(make_hook())")
add("llm-03b", "ch3viz", "그래디언트 해제", "시각화용 추론에서 그래디언트 계산을 끄세요.", "with torch.no_grad():")

# Chapter 4 - GPT architecture and generation
add("llm-04", "ch4", "LayerNorm", "평균과 분산으로 입력을 정규화하세요.", "(x - mean) / torch.sqrt(var + self.eps)")
add("llm-04", "ch4", "LayerNorm", "학습 가능한 scale과 shift를 적용하세요.", "self.scale * norm_x + self.shift")
add("llm-04", "ch4", "FeedForward", "임베딩 차원을 4배로 확장하는 Linear 층을 만드세요.", "nn.Linear(cfg[\"emb_dim\"], 4 * cfg[\"emb_dim\"])")
add("llm-04", "ch4", "FeedForward", "FeedForward 블록의 활성화 함수를 채우세요.", "GELU()")
add("llm-04", "ch4", "Residual Block", "정규화된 입력에 Attention을 적용하세요.", "x = self.att(x)")
add("llm-04", "ch4", "Residual Block", "두 번째 정규화 뒤에 FeedForward를 적용하세요.", "x = self.ff(x)")
add("llm-04", "ch4", "토큰 임베딩", "GPT의 토큰 임베딩 레이어를 완성하세요.", "nn.Embedding(cfg[\"vocab_size\"], cfg[\"emb_dim\"])")
add("llm-04", "ch4", "위치 임베딩", "GPT의 위치 임베딩 레이어를 완성하세요.", "nn.Embedding(cfg[\"context_length\"], cfg[\"emb_dim\"])")
add("llm-04", "ch4", "출력 헤드", "임베딩을 어휘 점수로 변환하는 출력 헤드를 만드세요.", "nn.Linear(cfg[\"emb_dim\"], cfg[\"vocab_size\"], bias=False)")
add("llm-04", "ch4", "입력 임베딩", "토큰 임베딩과 위치 임베딩을 더하세요.", "tok_embeds + pos_embeds")
add("llm-04", "ch4", "Transformer 통과", "입력을 쌓인 Transformer block에 통과시키세요.", "self.trf_blocks(x)")
add("llm-04", "ch4", "마지막 시점", "다음 토큰 예측에 마지막 시점 logits만 선택하세요.", "logits[:, -1, :]")
add("llm-04", "ch4", "Greedy Decoding", "가장 큰 logit의 토큰을 선택하세요.", "torch.argmax(logits, dim=-1, keepdim=True)")
add("llm-04", "ch4", "토큰 연결", "예측 토큰을 기존 시퀀스 뒤에 붙이세요.", "torch.cat((idx, idx_next), dim=1)")

# Chapter 5 - Pretraining
add("llm-05", "ch5", "Cross Entropy", "평탄화한 logits와 target으로 손실을 계산하세요.", "torch.nn.functional.cross_entropy(logits.flatten(0, 1), target_batch.flatten())")
add("llm-05", "ch5", "학습 모드", "학습 루프 전에 모델을 train 모드로 전환하세요.", "model.train()")
add("llm-05", "ch5", "기울기 초기화", "이전 배치의 gradient를 초기화하세요.", "optimizer.zero_grad()")
add("llm-05", "ch5", "배치 손실", "현재 입력과 타깃 배치의 손실을 계산하세요.", "calc_loss_batch(input_batch, target_batch, model, device)")
add("llm-05", "ch5", "역전파", "손실에서 역전파를 수행하세요.", "loss.backward()")
add("llm-05", "ch5", "가중치 갱신", "계산된 gradient로 파라미터를 갱신하세요.", "optimizer.step()")
add("llm-05", "ch5", "Greedy Decoding", "마지막 위치의 최대 logit 토큰을 선택하세요.", "torch.argmax(logits, dim=-1, keepdim=True)")
add("llm-05", "ch5", "배치 차원", "단일 토큰 시퀀스에 배치 차원을 추가하세요.", "unsqueeze(0)")
add("llm-05", "ch5", "배치 차원", "디코딩 전에 배치 차원을 제거하세요.", "token_ids.squeeze(0)")
add("llm-05", "ch5", "Optimizer", "모델 파라미터로 AdamW optimizer를 생성하세요.", "torch.optim.AdamW(model.parameters(), lr=0.0004, weight_decay=0.1)")

# Chapter 6A - Classification finetuning
add("llm-06a", "ch6", "Truncation", "토큰 시퀀스를 설정된 최대 길이로 자르세요.", "encoded_text[:self.max_length]")
add("llm-06a", "ch6", "Padding", "부족한 길이를 pad token으로 채우세요.", "encoded_text + [pad_token_id] * (self.max_length - len(encoded_text))")
add("llm-06a", "ch6", "Label", "DataFrame에서 분류 정답 Label을 가져오세요.", "self.data.iloc[index][\"Label\"]")
add("llm-06a", "ch6", "분류 Logits", "마지막 토큰의 출력만 분류에 사용하세요.", "logits[:, -1, :]")
add("llm-06a", "ch6", "파라미터 동결", "기존 모델의 모든 파라미터를 동결하세요.", "param.requires_grad = False")
add("llm-06a", "ch6", "출력층 교체", "이진 분류용 출력 헤드로 교체하세요.", "torch.nn.Linear(in_features=BASE_CONFIG[\"emb_dim\"], out_features=num_classes)")
add("llm-06a", "ch6", "선택적 미세조정", "마지막 Transformer block만 선택하세요.", "model.trf_blocks[-1].parameters()")
add("llm-06a", "ch6", "선택적 미세조정", "선택한 층의 학습을 다시 허용하세요.", "param.requires_grad = True")

# Chapter 6B - LoRA
add("llm-06b", "ch6lora", "LoRA A", "A 행렬을 입력 차원과 rank 크기로 생성하세요.", "torch.empty(in_dim, rank)")
add("llm-06b", "ch6lora", "LoRA B", "B 행렬을 rank와 출력 차원 크기로 생성하세요.", "torch.zeros(rank, out_dim)")
add("llm-06b", "ch6lora", "LoRA Forward", "LoRA의 스케일과 저랭크 행렬곱을 적용하세요.", "(self.alpha / self.rank) * (x @ self.A @ self.B)")
add("llm-06b", "ch6lora", "Residual 적용", "기존 Linear 출력에 LoRA 출력을 더하세요.", "self.linear(x) + self.lora(x)")
add("llm-06b", "ch6lora", "레이어 교체", "교체할 모듈이 Linear 층인지 확인하세요.", "isinstance(module, torch.nn.Linear)")
add("llm-06b", "ch6lora", "기존 가중치 동결", "LoRA 학습 전에 기존 파라미터를 동결하세요.", "param.requires_grad = False")
add("llm-06b", "ch6lora", "LoRA 주입", "모델의 Linear 층을 LoRA 버전으로 교체하세요.", "replace_linear_with_lora(model, rank=16, alpha=16)")

# Chapter 7A - Instruction finetuning
add("llm-07a", "ch7", "구분 토큰", "각 학습 시퀀스 끝에 구분 토큰을 추가하세요.", "pad_token_id", 1)
add("llm-07a", "ch7", "Padding", "배치의 최대 길이까지 pad token으로 채우세요.", "pad_token_id", 2)
add("llm-07a", "ch7", "입력 시프트", "입력에서 마지막 토큰을 제외하세요.", "torch.tensor(padded[:-1])")
add("llm-07a", "ch7", "타깃 시프트", "타깃에서 첫 번째 토큰을 제외하세요.", "torch.tensor(padded[1:])")
add("llm-07a", "ch7", "Padding Mask", "첫 pad token 뒤의 나머지 padding을 무시하세요.", "targets[indices[1:]] = ignore_index")

# Chapter 7B - DPO. These exact completions follow the exercise hints.
add("llm-07b", "dpo", "선호 응답", "chosen 시퀀스에 선호 응답을 연결하세요.", "chosen_response")
add("llm-07b", "dpo", "비선호 응답", "rejected 시퀀스에 비선호 응답을 연결하세요.", "rejected_response")
add("llm-07b", "dpo", "자동회귀 시프트", "레이블을 한 칸 앞당겨 logits와 정렬하세요.", "labels[:, 1:].clone()")
add("llm-07b", "dpo", "자동회귀 시프트", "logits의 마지막 시점을 제외하세요.", "logits[:, :-1, :]")
add("llm-07b", "dpo", "정답 로그확률", "정답 레이블 위치의 log probability를 모으세요.", "input=log_probs")
add("llm-07b", "dpo", "Policy 비율", "Policy 모델의 chosen-rejected 로그확률 차이를 구하세요.", "model_chosen_logprobs - model_rejected_logprobs")
add("llm-07b", "dpo", "Reference 비율", "Reference 모델의 chosen-rejected 로그확률 차이를 구하세요.", "reference_chosen_logprobs - reference_rejected_logprobs")
add("llm-07b", "dpo", "DPO Loss", "DPO logits에 log-sigmoid 손실을 적용하세요.", "-F.logsigmoid(beta * logits)")


def read_code_cells(relative_path: str) -> list[tuple[int, str]]:
    payload = json.loads((LLM_ROOT / relative_path).read_text(encoding="utf-8"))
    return [
        (index, "".join(cell.get("source", [])))
        for index, cell in enumerate(payload["cells"])
        if cell.get("cell_type") == "code"
    ]


def clean_source(source: str) -> str:
    lines = []
    for line in source.splitlines():
        stripped = line.strip()
        if "????" in line or "TODO" in line or "힌트:" in line:
            continue
        if stripped.startswith("# region") or stripped.startswith("# endregion"):
            continue
        lines.append(line.rstrip())
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def source_for(spec: dict[str, str]) -> tuple[str, int, str]:
    if spec["sourceKey"] == "dpo":
        return DPO_SOURCE, 0, "Chapter_7_Exercise_Follow_Instructions_dpo.ipynb"

    source_file = SOURCES[spec["sourceKey"]]
    matches = []
    for cell_index, source in read_code_cells(source_file):
        cleaned = clean_source(source)
        if spec["answer"] in cleaned:
            line_count = len(cleaned.splitlines())
            short_penalty = 10000 if line_count < 4 else 0
            matches.append((short_penalty + line_count, cell_index, cleaned))
    if not matches:
        raise ValueError(f"Answer not found in {source_file}: {spec['answer']}")
    _, cell_index, source = min(matches)
    return source, cell_index, source_file


def build() -> None:
    cells: dict[str, dict[str, object]] = {}
    questions = []
    chapter_lookup = {chapter["id"]: chapter for chapter in CHAPTERS}

    for index, spec in enumerate(SPECS, start=1):
        source, cell_index, answer_source = source_for(spec)
        source_id = f"{spec['sourceKey']}-cell-{cell_index}"
        if spec["sourceKey"] == "dpo":
            source_id = "dpo-completions"
        cells[source_id] = {
            "source": source,
            "cell": cell_index,
            "answerSource": answer_source,
        }
        chapter = chapter_lookup[spec["chapterId"]]
        questions.append({
            "id": f"llm-{index:03d}",
            "chapterId": spec["chapterId"],
            "chapterNumber": chapter["number"],
            "chapterTitle": chapter["title"],
            "file": chapter["file"],
            "topic": spec["topic"],
            "prompt": spec["prompt"],
            "answer": spec["answer"],
            "occurrence": spec["occurrence"],
            "sourceId": source_id,
        })

    for chapter in CHAPTERS:
        chapter["questionCount"] = sum(q["chapterId"] == chapter["id"] for q in questions)

    OUTPUT.write_text(
        json.dumps({"chapters": CHAPTERS, "cells": cells, "questions": questions}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Generated {len(questions)} questions across {len(CHAPTERS)} notebooks -> {OUTPUT}")


if __name__ == "__main__":
    build()
