"""Append a compact, certification-focused Vision question bank."""

from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
VISION_ROOT = REPO_ROOT / "Study" / "Vision"
OUTPUT = REPO_ROOT / "ExamTrainer" / "app" / "question-bank.json"

CHAPTERS = [
    {"id": "vision-resnet", "subject": "Vision", "number": "01", "title": "ResNet18 · CIFAR-10", "file": "01_ResNet18_CIFAR10.ipynb"},
    {"id": "vision-vit", "subject": "Vision", "number": "02", "title": "Vision Transformer · CIFAR-10", "file": "02_ViT_CIFAR10.ipynb"},
    {"id": "vision-detr", "subject": "Vision", "number": "03", "title": "DETR", "file": "03_DETR.ipynb"},
    {"id": "vision-unet", "subject": "Vision", "number": "04", "title": "U-Net", "file": "04_Unet.ipynb"},
    {"id": "vision-ddpm", "subject": "Vision", "number": "05", "title": "DDPM", "file": "05_DDPM.ipynb"},
    {"id": "vision-sd", "subject": "Vision", "number": "06", "title": "Stable Diffusion v1.4", "file": "06_Stable_Diffusion_v1_4.ipynb"},
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


# ResNet: torchvision augmentation and CIFAR-sized stem changes.
add("vision-resnet", 5, "Data Augmentation", "패딩 후 32×32 영역을 무작위로 잘라내는 transform을 완성하세요.", "T.RandomCrop(32, padding=4)")
add("vision-resnet", 8, "CIFAR Stem", "CIFAR-10 해상도에 맞춘 ResNet18의 첫 convolution layer를 선언하세요.", "nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False)")
add("vision-resnet", 8, "MaxPool 제거", "작은 입력에서 초기 해상도를 보존하도록 기존 maxpool을 대체하세요.", "nn.Identity()")

# ViT: QKV attention and the image-token flow.
add("vision-vit", 8, "QKV Projection", "입력 토큰에서 Q·K·V를 한 번에 만드는 선형 layer를 선언하세요.", "nn.Linear(dim, inner_dim * 3, bias = False)")
add("vision-vit", 8, "Scaled Dot-product", "Q와 K의 유사도를 구하고 attention scale을 적용하세요.", "einsum('b h i d, b h j d -> b h i j', q, k) * self.scale")
add("vision-vit", 10, "CLS Token", "복제한 CLS 토큰을 patch token 시퀀스 앞에 연결하세요.", "torch.cat((cls_tokens, x), dim=1)")

# DETR: ImageNet preprocessing, pretrained model, and no-object filtering.
add("vision-detr", 7, "ImageNet 정규화", "사전학습 backbone 분포에 맞춰 입력 이미지를 정규화하세요.", "T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])")
add("vision-detr", 11, "사전학습 DETR", "torch.hub에서 사전학습된 DETR-ResNet50 모델을 불러오세요.", "torch.hub.load('facebookresearch/detr', 'detr_resnet50', pretrained=True)")
add("vision-detr", 17, "No-object 제외", "DETR 로짓을 확률로 바꾸고 마지막 no-object 클래스를 제외하세요.", "outputs['pred_logits'].softmax(-1)[0, :, :-1]")

# U-Net: skip connection, binary segmentation loss, and mask conversion.
add("vision-unet", 6, "Skip Connection", "encoder와 decoder feature를 채널 축으로 연결하세요.", "torch.cat([x2, x1], dim=1)")
add("vision-unet", 8, "Segmentation Loss", "binary segmentation의 logits에 사용할 손실 함수를 선언하세요.", "nn.BCEWithLogitsLoss()")
add("vision-unet", 14, "Mask Threshold", "sigmoid 확률을 0.5 기준의 binary mask로 변환하세요.", "(probs > 0.5).float()")

# DDPM: forward noising, noise-prediction training, and reverse sampling.
add("vision-ddpm", 15, "Forward Diffusion", "x₀와 Gaussian noise를 이용해 임의 시점 xₜ를 계산하세요.", "sqrt_alphas_cumprod_t * x_start + sqrt_one_minus_alphas_cumprod_t * noise")
add("vision-ddpm", 17, "Noisy Sample", "학습 시 정답 noise를 사용해 xₜ를 생성하세요.", "q_sample(x_start=x_start, t=t, noise=noise)")
add("vision-ddpm", 21, "Reverse Diffusion", "역과정 평균에서 모델이 예측한 noise를 제거하는 항을 완성하세요.", "x - betas_t * model(x, t) / sqrt_one_minus_alphas_cumprod_t")

# Evaluation metrics and Stable Diffusion guidance.
add("vision-resnet", 10, "Top-1 Accuracy", "예측 class와 정답이 일치하는 비율을 scalar accuracy로 계산하세요.", "(preds == targets).float().mean().item()")
add("vision-sd", 9, "Classifier-free Guidance", "프롬프트 조건을 따르는 강도를 강의자료 값으로 설정하세요.", "guidance_scale = 7.5")
add("vision-vit", 26, "Confusion Matrix", "전체 정답과 예측 class로 confusion matrix를 계산하세요.", "confusion_matrix(all_labels, all_preds)")


if len(SPECS) > 20:
    raise ValueError("Focused Vision bank must stay at 20 questions or fewer.")


def read_cell(chapter_id: str, cell_index: int) -> tuple[str, str]:
    chapter = next(chapter for chapter in CHAPTERS if chapter["id"] == chapter_id)
    notebook_path = VISION_ROOT / chapter["file"]
    notebook = json.loads(notebook_path.read_text(encoding="utf-8"))
    cell = notebook["cells"][cell_index]
    if cell.get("cell_type") != "code":
        raise ValueError(f"Expected code cell: {chapter['file']} cell {cell_index}")
    return "".join(cell.get("source", [])), chapter["file"]


def clean_source(source: str) -> str:
    lines = [
        line.rstrip()
        for line in source.splitlines()
        if not ("use_" + "auth_" + "token" in line and "access_" + "token" in line)
    ]
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def build() -> None:
    if not OUTPUT.exists():
        raise FileNotFoundError("Generate the LLM, RAG, and Data banks before the Vision bank.")

    bank = json.loads(OUTPUT.read_text(encoding="utf-8"))
    chapters = [chapter for chapter in bank["chapters"] if chapter.get("subject") != "Vision"]
    questions = [question for question in bank["questions"] if question.get("subject") != "Vision"]
    kept_source_ids = {question["sourceId"] for question in questions}
    cells = {source_id: cell for source_id, cell in bank["cells"].items() if source_id in kept_source_ids}
    chapter_lookup = {chapter["id"]: chapter for chapter in CHAPTERS}

    vision_questions = []
    for index, spec in enumerate(SPECS, start=1):
        chapter_id = str(spec["chapterId"])
        source, answer_source = read_cell(chapter_id, int(spec["cell"]))
        source = clean_source(source)
        answer = str(spec["answer"])
        occurrence = int(spec["occurrence"])
        if source.count(answer) <= occurrence:
            raise ValueError(f"Answer not found: {answer_source} cell {spec['cell']} -> {answer}")

        short_id = chapter_id.removeprefix("vision-")
        source_id = f"vision-{short_id}-cell-{spec['cell']}"
        cells[source_id] = {"source": source, "cell": spec["cell"], "answerSource": answer_source}
        chapter = chapter_lookup[chapter_id]
        vision_questions.append({
            "id": f"vision-{index:03d}",
            "subject": "Vision",
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

    for chapter in CHAPTERS:
        chapter["questionCount"] = sum(question["chapterId"] == chapter["id"] for question in vision_questions)

    OUTPUT.write_text(json.dumps({
        "chapters": chapters + CHAPTERS,
        "cells": cells,
        "questions": questions + vision_questions,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(vision_questions)} focused Vision questions across {len(CHAPTERS)} notebooks -> {OUTPUT}")


if __name__ == "__main__":
    build()
