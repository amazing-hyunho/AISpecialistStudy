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

# Every remaining assignment inside YOUR CODE STARTS/ENDS HERE. The focused
# questions above keep their IDs; these required practice completions append.
add("ondevice-cnn-pruning", 29, "Magnitude Importance", "가중치의 절댓값으로 importance를 계산하세요.", "importance = torch.abs(weight)")
add(
    "ondevice-cnn-pruning", 48, "Layer-wise Sparsity",
    "각 CNN layer에 강의 답안의 sparsity 값을 설정하세요.",
    "    'backbone.conv0.weight': 0.5,\n"
    "    'backbone.conv1.weight': 0.8,\n"
    "    'backbone.conv2.weight': 0.8,\n"
    "    'backbone.conv3.weight': 0.7,\n"
    "    'backbone.conv4.weight': 0.7,\n"
    "    'backbone.conv5.weight': 0.8,\n"
    "    'backbone.conv6.weight': 0.8,\n"
    "    'backbone.conv7.weight': 0.9,\n"
    "    'classifier.weight': 0.9",
)
add("ondevice-cnn-pruning", 54, "Global Weight 결합", "pruning 대상 가중치를 하나의 tensor로 결합하세요.", "all_weights = torch.cat(parameters_to_prune)")
add("ondevice-cnn-pruning", 54, "Global 원소 수", "결합한 가중치의 전체 원소 수를 구하세요.", "num_elements = all_weights.numel()")
add("ondevice-cnn-pruning", 54, "Global Pruning 개수", "global sparsity로 0으로 만들 원소 수를 계산하세요.", "num_zeros = round(num_elements * sparsity)")
add("ondevice-cnn-pruning", 54, "Global Importance", "결합한 가중치의 절댓값 importance를 계산하세요.", "importance = torch.abs(all_weights)")
add("ondevice-cnn-pruning", 54, "Global Threshold", "global pruning에 사용할 k번째 threshold를 구하세요.", "threshold = torch.kthvalue(importance, num_zeros)[0]")
add("ondevice-cnn-pruning", 65, "Sparsity Schedule", "pruning 시작 전에는 sparsity를 0으로 설정하세요.", "sparsity = 0")
add("ondevice-cnn-pruning", 65, "Sparsity Schedule", "pruning 종료 이후에는 최종 sparsity를 사용하세요.", "sparsity = sparsity_end")
add("ondevice-cnn-pruning", 65, "Sparsity Schedule", "pruning 구간의 cubic sparsity schedule을 완성하세요.", "sparsity = sparsity_end + (sparsity_start - sparsity_end) * (1 - (epoch - epoch_start) / (epoch_end - epoch_start)) ** exponent")

add("ondevice-cnn-quant", 24, "Linear Quantization", "scale된 부동소수 tensor를 정수값으로 rounding하세요.", "rounded_tensor = torch.round(scaled_tensor)")
add("ondevice-cnn-quant", 55, "Output Zero Point", "requantization 결과에 output zero point를 더하세요.", "output = output + output_zero_point")
add("ondevice-cnn-quant", 63, "Conv Requantization", "convolution 정수 출력을 input·weight·output scale로 재조정하세요.", "output = output*(input_scale * weight_scale / output_scale)")
add("ondevice-cnn-quant", 63, "Conv Zero Point", "convolution requantization 결과에 output zero point를 더하세요.", "output = output + output_zero_point")
add("ondevice-cnn-quant", 85, "Codebook 크기", "bitwidth에 따른 클러스터 수를 계산하세요.", "n_clusters = 2**bitwidth")
add("ondevice-cnn-quant", 96, "Centroid 갱신", "k번 클러스터에 할당된 값의 평균으로 centroid를 갱신하세요.", "codebook.centroids[k] = torch.mean(fp32_tensor[codebook.labels==k])")

add("ondevice-kd", 26, "Student Forward", "Student 모델의 logits을 계산하세요.", "student_logits = student(inputs)")
add("ondevice-kd", 26, "Student Probability", "temperature를 적용한 Student logits을 확률분포로 변환하세요.", "student_prob = nn.functional.softmax(student_logits / T, dim=-1)")
add("ondevice-kd", 26, "Label Loss", "Student logits과 정답 label의 cross-entropy loss를 계산하세요.", "label_loss = ce_loss(student_logits, labels)")
add("ondevice-kd", 39, "Teacher Representation", "gradient 없이 Teacher의 hidden representation을 구하세요.", "_, teacher_hidden_representation = teacher(inputs)")
add("ondevice-kd", 39, "Student Representation", "Student의 logits과 hidden representation을 구하세요.", "student_logits, student_hidden_representation = student(inputs)")
add("ondevice-kd", 39, "Cosine Distillation", "Student와 Teacher hidden representation의 cosine loss를 계산하세요.", "hidden_rep_loss = cosine_loss(student_hidden_representation, teacher_hidden_representation,\n                                          target=torch.ones(inputs.size(0)).cuda())")
add("ondevice-kd", 39, "Label Loss", "Student logits과 label의 cross-entropy loss를 계산하세요.", "label_loss = ce_loss(student_logits, labels)")
add("ondevice-kd", 39, "Representation Loss 결합", "hidden representation loss와 label loss를 가중합하세요.", "loss = hidden_rep_loss_weight * hidden_rep_loss + ce_loss_weight * label_loss")
add("ondevice-kd", 52, "Teacher Feature Map", "gradient 없이 Teacher feature map을 구하세요.", "_, teacher_feature_map = teacher(inputs)")
add("ondevice-kd", 52, "Student Feature Map", "Student logits과 regressor feature map을 구하세요.", "student_logits, regressor_feature_map = student(inputs)")
add("ondevice-kd", 52, "Feature-map Loss", "Student regressor와 Teacher feature map의 MSE를 계산하세요.", "hidden_rep_loss = mse_loss(regressor_feature_map, teacher_feature_map)")
add("ondevice-kd", 52, "Label Loss", "Student logits과 label의 cross-entropy loss를 계산하세요.", "label_loss = ce_loss(student_logits, labels)")
add("ondevice-kd", 52, "Feature-map Loss 결합", "feature-map loss와 label loss를 가중합하세요.", "loss = feature_map_weight * hidden_rep_loss + ce_loss_weight * label_loss")

add("ondevice-llm-pruning", 10, "Weight 원소 수", "LLM 가중치 tensor의 전체 원소 수를 구하세요.", "num_elements = W.numel()")
add("ondevice-llm-pruning", 10, "Pruning 개수", "sparsity로 제거할 LLM 가중치 개수를 계산하세요.", "num_zeros = round(num_elements * sparsity)")
add("ondevice-llm-pruning", 10, "Weight Importance", "LLM 가중치의 절댓값 importance를 계산하세요.", "importance = torch.abs(W)")
add("ondevice-llm-pruning", 10, "Weight Threshold", "제거 개수에 해당하는 magnitude threshold를 구하세요.", "threshold = torch.kthvalue(importance.flatten(), num_zeros)[0]")
add("ondevice-llm-pruning", 10, "Weight Mask", "threshold보다 큰 가중치만 남기는 mask를 만드세요.", "mask = importance > threshold")
add("ondevice-llm-pruning", 19, "Weight Shape", "WANDA mask 계산을 위해 가중치의 행과 열을 구하세요.", "row, col = W.shape")
add("ondevice-llm-pruning", 19, "Row Pruning 개수", "각 행에서 제거할 열 개수를 계산하세요.", "num_zeros_per_row = round(col * sparsity)")
add("ondevice-llm-pruning", 19, "Row Threshold", "각 행별 WANDA importance threshold를 구하세요.", "threshold = torch.kthvalue(importance, num_zeros_per_row, dim=1)[0]")

add("ondevice-llm-quant", 34, "AWQ Scale", "activation scale에 ratio를 거듭제곱해 AWQ scale을 계산하세요.", "scales = s_x ** ratio")
add("ondevice-llm-quant", 50, "LayerNorm Bias", "LayerNorm bias를 smoothing scale로 나누세요.", "ln.bias.div_(scale)")
add("ondevice-llm-quant", 67, "Embedding Rotation", "Embedding 가중치의 오른쪽에 rotation 행렬을 곱하세요.", "m.weight.data = W_ @ R1")
add("ondevice-llm-quant", 67, "Output Rotation", "o_proj와 down_proj 가중치의 왼쪽에 전치 rotation을 곱하세요.", "m.weight.data = R1.T @ W_")
add("ondevice-llm-quant", 67, "Input Rotation", "Q/K/V와 FFN 가중치의 오른쪽에 rotation 행렬을 곱하세요.", "m.weight.data = W_ @ R1", 1)

if len(SPECS) > 80:
    raise ValueError("Unexpected On-device question expansion; audit the explicit-fill list.")


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
            "isSourceBlank": True,
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
