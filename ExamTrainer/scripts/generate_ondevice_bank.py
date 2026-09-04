"""Append a compact, certification-focused On-device question bank."""

from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
ONDEVICE_ROOT = REPO_ROOT / "Study" / "On-Device" / "실습"
OUTPUT = REPO_ROOT / "ExamTrainer" / "app" / "question-bank.json"

CHAPTERS = [
    {
        "id": "ondevice-cnn-pruning",
        "subject": "On-device",
        "number": "01",
        "title": "Pruning for CNN",
        "file": "1. Pruning for CNN.ipynb",
        "answerFile": "1. Pruning for CNN_answer.ipynb",
    },
    {
        "id": "ondevice-cnn-quant",
        "subject": "On-device",
        "number": "02",
        "title": "Quantization for CNN",
        "file": "2. Quantization for CNN.ipynb",
        "answerFile": "2. Quantization for CNN_answer.ipynb",
    },
    {
        "id": "ondevice-kd",
        "subject": "On-device",
        "number": "03",
        "title": "Knowledge Distillation",
        "file": "3. Knowledge Distillation.ipynb",
        "answerFile": "3. Knowledge Distillation_answer.ipynb",
    },
    {
        "id": "ondevice-llm-pruning",
        "subject": "On-device",
        "number": "04",
        "title": "Pruning for LLM",
        "file": "4. Pruning for LLM.ipynb",
        "answerFile": "4. Pruning for LLM_answer.ipynb",
    },
    {
        "id": "ondevice-llm-quant",
        "subject": "On-device",
        "number": "05",
        "title": "Quantization for LLM",
        "file": "5. Quantization for LLM.ipynb",
        "answerFile": "5. Quantization for LLM_answer.ipynb",
    },
]

SPECS: list[dict[str, object]] = []


def add(chapter: str, cell: int, topic: str, prompt: str, answer: str, occurrence: int = 0) -> None:
    SPECS.append({
        "chapterId": chapter,
        "cell": cell,
        "topic": topic,
        "prompt": prompt,
        "answer": answer,
        "occurrence": occurrence,
    })


# CNN pruning: magnitude importance, threshold, and binary mask.
add("ondevice-cnn-pruning", 29, "Pruning 개수", "목표 sparsity로 제거할 가중치 원소 수를 계산하세요.", "round(weight.numel() * sparsity)")
add("ondevice-cnn-pruning", 29, "Magnitude Threshold", "절댓값 importance에서 pruning 기준값을 구하세요.", "torch.kthvalue(importance.flatten(), num_pruned_elements)[0]")
add("ondevice-cnn-pruning", 29, "Pruning Mask", "threshold보다 중요한 가중치만 유지하는 mask를 만드세요.", "importance > threshold")

# CNN quantization: quantize, derive scale/zero point, and requantize layer output.
add("ondevice-cnn-quant", 24, "Linear Quantization", "부동소수점 tensor를 quantization scale로 나누세요.", "fp_tensor/scale")
add("ondevice-cnn-quant", 33, "Quantization Scale", "부동소수점 범위와 정수 범위로 scale을 계산하세요.", "(fp_max - fp_min) / (quantized_max - quantized_min)")
add("ondevice-cnn-quant", 33, "Zero Point", "최솟값을 기준으로 zero point를 계산하세요.", "round(quantized_min - fp_min/scale)")
add("ondevice-cnn-quant", 55, "Output Requantization", "누적된 정수 출력을 input·weight·output scale로 재조정하세요.", "output*(input_scale * weight_scale / output_scale)")

# Distillation: frozen teacher, softened distributions, KL term, and label loss blend.
add("ondevice-kd", 26, "Teacher Forward", "Teacher의 가중치를 갱신하지 않고 logits을 얻으세요.", "teacher_logits = teacher(inputs)")
add("ondevice-kd", 26, "Soft Target", "temperature를 적용한 Teacher logits을 확률분포로 변환하세요.", "nn.functional.softmax(teacher_logits / T, dim=-1)")
add("ondevice-kd", 26, "Distillation Loss", "Teacher와 Student 확률분포의 soft-target loss를 계산하세요.", "torch.sum(soft_targets * (soft_targets.log() - student_prob.log())) / student_prob.size(0) * (T**2)")
add("ondevice-kd", 26, "Loss 결합", "soft-target loss와 정답 label loss를 가중합하세요.", "soft_target_loss_weight * soft_targets_loss + ce_loss_weight * label_loss")

# LLM pruning: activation-aware importance and row-wise WANDA mask.
add("ondevice-llm-pruning", 16, "Activation Norm", "입력 activation의 채널별 L2 norm 제곱을 계산하세요.", "torch.norm(x, p=2, dim=1) ** 2")
add("ondevice-llm-pruning", 19, "WANDA Importance", "가중치 크기와 입력 feature를 결합해 importance를 계산하세요.", "torch.abs(W) * input_feat[n]")
add("ondevice-llm-pruning", 19, "Row-wise Mask", "각 행의 threshold를 broadcast하여 pruning mask를 만드세요.", "importance > threshold.reshape(row, 1)")

# LLM quantization: select outliers and smooth activation/weight scales.
add("ondevice-llm-quant", 27, "Outlier Channel", "importance 상위 1% 채널의 index를 선택하세요.", "torch.topk(importance, int(len(importance) * 0.01))[1]")
add("ondevice-llm-quant", 27, "Scale 복원", "pseudo quantization 후 중요 채널의 임시 확대를 되돌리세요.", "m.weight.data[:, outlier_mask] /= scale_factor")
add("ondevice-llm-quant", 55, "SmoothQuant Scale", "activation과 weight scale에 alpha를 적용해 smoothing scale을 계산하세요.", "act_scales.pow(alpha) / weight_scales.pow(1 - alpha)")
add("ondevice-llm-quant", 50, "LayerNorm Smoothing", "연결된 FC와 상쇄되도록 LayerNorm weight를 scale로 나누세요.", "ln.weight.div_(scale)")


if len(SPECS) > 20:
    raise ValueError("Focused On-device bank must stay at 20 questions or fewer.")


def read_cell(chapter_id: str, cell_index: int) -> tuple[str, str]:
    chapter = next(chapter for chapter in CHAPTERS if chapter["id"] == chapter_id)
    answer_file = str(chapter["answerFile"])
    notebook = json.loads((ONDEVICE_ROOT / answer_file).read_text(encoding="utf-8"))
    cell = notebook["cells"][cell_index]
    if cell.get("cell_type") != "code":
        raise ValueError(f"Expected code cell: {answer_file} cell {cell_index}")
    return "".join(cell.get("source", [])), answer_file


def clean_source(source: str) -> str:
    lines = [
        line.rstrip()
        for line in source.splitlines()
        if "YOUR CODE STARTS HERE" not in line and "YOUR CODE ENDS HERE" not in line
    ]
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def build() -> None:
    if not OUTPUT.exists():
        raise FileNotFoundError("Generate the other subject banks before the On-device bank.")

    bank = json.loads(OUTPUT.read_text(encoding="utf-8"))
    chapters = [chapter for chapter in bank["chapters"] if chapter.get("subject") != "On-device"]
    questions = [question for question in bank["questions"] if question.get("subject") != "On-device"]
    kept_source_ids = {question["sourceId"] for question in questions}
    cells = {source_id: cell for source_id, cell in bank["cells"].items() if source_id in kept_source_ids}
    chapter_lookup = {chapter["id"]: chapter for chapter in CHAPTERS}

    ondevice_questions = []
    for index, spec in enumerate(SPECS, start=1):
        chapter_id = str(spec["chapterId"])
        source, answer_source = read_cell(chapter_id, int(spec["cell"]))
        source = clean_source(source)
        answer = str(spec["answer"])
        occurrence = int(spec["occurrence"])
        if source.count(answer) <= occurrence:
            raise ValueError(f"Answer not found: {answer_source} cell {spec['cell']} -> {answer}")

        short_id = chapter_id.removeprefix("ondevice-")
        source_id = f"ondevice-{short_id}-cell-{spec['cell']}"
        cells[source_id] = {"source": source, "cell": spec["cell"], "answerSource": answer_source}
        chapter = chapter_lookup[chapter_id]
        ondevice_questions.append({
            "id": f"ondevice-{index:03d}",
            "subject": "On-device",
            "chapterId": chapter_id,
            "chapterNumber": chapter["number"],
            "chapterTitle": chapter["title"],
            "file": chapter["file"],
            "topic": spec["topic"],
            "prompt": spec["prompt"],
            "answer": answer,
            "occurrence": occurrence,
            "sourceId": source_id,
        })

    public_chapters = []
    for chapter in CHAPTERS:
        chapter["questionCount"] = sum(question["chapterId"] == chapter["id"] for question in ondevice_questions)
        public_chapters.append({key: value for key, value in chapter.items() if key != "answerFile"})

    OUTPUT.write_text(json.dumps({
        "chapters": chapters + public_chapters,
        "cells": cells,
        "questions": questions + ondevice_questions,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(ondevice_questions)} focused On-device questions across {len(CHAPTERS)} notebooks -> {OUTPUT}")


if __name__ == "__main__":
    build()
