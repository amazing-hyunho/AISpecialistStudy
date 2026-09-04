"""Append a compact, certification-focused Data question bank."""

from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
TIME_ROOT = REPO_ROOT / "Study" / "TIME"
OUTPUT = REPO_ROOT / "ExamTrainer" / "app" / "question-bank.json"

CHAPTERS = [
    {
        "id": "data-ts",
        "subject": "Data",
        "number": "TS",
        "title": "Time Series",
        "file": "ts_practice.ipynb",
    },
    {
        "id": "data-gcf",
        "subject": "Data",
        "number": "GCF",
        "title": "Graph Collaborative Filtering",
        "file": "RecSys_GCF_practice.ipynb",
    },
    {
        "id": "data-ncf",
        "subject": "Data",
        "number": "NCF",
        "title": "Neural Collaborative Filtering",
        "file": "RecSys_NCF.ipynb",
    },
]

SOURCES = {
    "ts": Path("3_4-ts-practice") / "ts_solution.ipynb",
    "gcf": Path("7_8-recsys-practice") / "RecSys_GCF_sol.ipynb",
    "ncf": Path("7_8-recsys-practice") / "RecSys_NCF.ipynb",
}

SPECS: list[dict[str, object]] = []


def add(chapter: str, source: str, cell: int, topic: str, prompt: str, answer: str, occurrence: int = 0) -> None:
    SPECS.append({
        "chapterId": chapter,
        "sourceKey": source,
        "cell": cell,
        "topic": topic,
        "prompt": prompt,
        "answer": answer,
        "occurrence": occurrence,
    })


# Time series: practice blanks resolved against ts_solution.ipynb.
add("data-ts", "ts", 23, "Device 이동", "학습 입력과 정답을 실행 장치로 이동하세요.", "batch_x, batch_y = batch_x.to(device), batch_y.to(device)")
add("data-ts", "ts", 23, "모델 출력", "시퀀스의 마지막 시점 예측값을 선택하세요.", "model(batch_x)[:, -1, 0]")
add("data-ts", "ts", 23, "손실 계산", "예측값과 정답으로 학습 손실을 계산하세요.", "loss_fn(pred, batch_y)")
add("data-ts", "ts", 23, "Gradient 초기화", "이전 학습 단계의 gradient를 초기화하세요.", "optimizer.zero_grad()")
add("data-ts", "ts", 23, "역전파", "현재 손실을 역전파하세요.", "loss.backward()")
add("data-ts", "ts", 23, "가중치 갱신", "계산된 gradient로 모델 파라미터를 갱신하세요.", "optimizer.step()")
add("data-ts", "ts", 27, "RMSE", "시계열 정답과 예측값의 RMSE를 계산하세요.", "root_mean_squared_error(y_test, test_predictions)")
add("data-ts", "ts", 27, "MAPE", "시계열 정답과 예측값의 MAPE를 계산하세요.", "mean_absolute_percentage_error(y_test, test_predictions)")
add("data-ts", "ts", 34, "RNN Layer", "입력·은닉 차원과 층 수로 batch-first RNN을 선언하세요.", "nn.RNN(input_size, hidden_size, num_layers, batch_first=True)")

# NGCF: explicit fill sections resolved against RecSys_GCF_sol.ipynb.
add("data-gcf", "gcf", 13, "Degree 정규화", "사용자와 아이템 degree로 edge 정규화 계수를 계산하세요.", "1.0/torch.sqrt(deg[src]*deg[dst])")
add("data-gcf", "gcf", 13, "Message Passing", "아이템 노드로 전달할 edge message를 계산하세요.", "self.W1(src_feat) + self.W2(src_feat*dst_feat)")
add("data-gcf", "gcf", 13, "Message 집계", "아이템 목적지 인덱스에 edge message를 누적하세요.", "aggregated_messages.index_add_(0, dst, edge_messages_for_dst)")
add("data-gcf", "gcf", 14, "NGCF Layer", "각 NGCF layer에 edge와 현재 node feature를 전달하세요.", "layer(edge_index, node_features,self.num_users, self.num_items)")
add("data-gcf", "gcf", 14, "Layer 결합", "모든 layer의 feature를 마지막 차원으로 연결하세요.", "torch.concat(layer_outputs,dim=-1)")
add("data-gcf", "gcf", 14, "사용자 Feature", "결합된 feature에서 사용자 부분을 선택하세요.", "final_features[:self.num_users]")
add("data-gcf", "gcf", 14, "아이템 Feature", "결합된 feature에서 아이템 부분을 선택하세요.", "final_features[self.num_users:]")

# NCF: complete notebook code selected for model flow and sklearn metrics.
add("data-ncf", "ncf", 10, "Embedding 결합", "사용자와 영화 embedding을 입력 feature로 연결하세요.", "torch.cat([user_embedding, movie_embedding], dim = 1)")
add("data-ncf", "ncf", 18, "평가 Metric", "sklearn으로 실제 평점과 모델 출력의 MSE를 계산하세요.", "mean_squared_error(target_rating_list, model_output_list)")


if len(SPECS) > 20:
    raise ValueError("Focused Data bank must stay at 20 questions or fewer.")


def read_cell(source_key: str, cell_index: int) -> tuple[str, str]:
    relative_path = SOURCES[source_key]
    notebook = json.loads((TIME_ROOT / relative_path).read_text(encoding="utf-8"))
    cell = notebook["cells"][cell_index]
    if cell.get("cell_type") != "code":
        raise ValueError(f"Expected code cell: {relative_path} cell {cell_index}")
    return "".join(cell.get("source", [])), relative_path.name


def clean_source(source: str) -> str:
    lines = [
        line.rstrip()
        for line in source.splitlines()
        if "fill this part" not in line.lower()
        and not line.strip().lower().startswith("### todo")
    ]
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def build() -> None:
    if not OUTPUT.exists():
        raise FileNotFoundError("Generate the LLM and RAG banks before the Data bank.")

    bank = json.loads(OUTPUT.read_text(encoding="utf-8"))
    chapters = [chapter for chapter in bank["chapters"] if chapter.get("subject") != "Data"]
    questions = [question for question in bank["questions"] if question.get("subject") != "Data"]
    kept_source_ids = {question["sourceId"] for question in questions}
    cells = {source_id: cell for source_id, cell in bank["cells"].items() if source_id in kept_source_ids}
    chapter_lookup = {chapter["id"]: chapter for chapter in CHAPTERS}

    data_questions = []
    for index, spec in enumerate(SPECS, start=1):
        source, answer_source = read_cell(str(spec["sourceKey"]), int(spec["cell"]))
        source = clean_source(source)
        answer = str(spec["answer"])
        occurrence = int(spec["occurrence"])
        if source.count(answer) <= occurrence:
            raise ValueError(f"Answer not found: {answer_source} cell {spec['cell']} -> {answer}")

        source_id = f"data-{spec['sourceKey']}-cell-{spec['cell']}"
        cells[source_id] = {"source": source, "cell": spec["cell"], "answerSource": answer_source}
        chapter = chapter_lookup[str(spec["chapterId"])]
        data_questions.append({
            "id": f"data-{index:03d}",
            "subject": "Data",
            "chapterId": spec["chapterId"],
            "chapterNumber": chapter["number"],
            "chapterTitle": chapter["title"],
            "file": chapter["file"],
            "topic": spec["topic"],
            "prompt": spec["prompt"],
            "answer": answer,
            "occurrence": occurrence,
            "sourceId": source_id,
        })

    for chapter in CHAPTERS:
        chapter["questionCount"] = sum(question["chapterId"] == chapter["id"] for question in data_questions)

    OUTPUT.write_text(json.dumps({
        "chapters": chapters + CHAPTERS,
        "cells": cells,
        "questions": questions + data_questions,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(data_questions)} focused Data questions across {len(CHAPTERS)} notebooks -> {OUTPUT}")


if __name__ == "__main__":
    build()
