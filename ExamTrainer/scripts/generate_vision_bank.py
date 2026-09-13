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


# Additions are appended so previously saved question IDs retain their meaning.
# PDF: data construction and torchvision transforms (19–22).
add("vision-resnet", 5, "좌우 반전 증강", "학습 이미지의 좌우를 무작위로 뒤집는 transform을 완성하세요.", "T.RandomHorizontalFlip()")
add("vision-resnet", 5, "이미지 Tensor 변환", "학습용 PIL 이미지를 채널 우선 Tensor로 바꾸는 transform을 완성하세요.", "T.ToTensor()")
add("vision-resnet", 5, "평가 전처리 구성", "무작위 증강을 하지 않는 평가 전처리에서, 학습 때와 같은 채널 통계로 정규화하세요.", "T.Normalize(CIFAR10_MEAN, CIFAR10_STD)", occurrence=1)
add("vision-resnet", 5, "학습 배치 구성", "학습 데이터셋을 배치로 묶고 매 epoch 순서를 섞는 DataLoader를 구성하세요.", "DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=True)")

# PDF: meaning and construction of main layers (23–24).
add("vision-vit", 10, "Patch Embedding 투영", "펼친 이미지 패치를 Transformer의 토큰 차원으로 투영하는 layer를 선언하세요.", "nn.Linear(patch_dim, cfg.dim)")
add("vision-vit", 8, "Attention Residual", "Attention 출력에 입력을 더하는 residual 연결을 완성하세요.", "attn(x) + x")

# PDF: connect predictions and targets to training (25–31).
add("vision-vit", 18, "분류 로그확률", "클래스 축을 따라 logits를 NLLLoss에 필요한 로그확률로 변환하세요.", "F.log_softmax(model(data), dim=1)")
add("vision-vit", 18, "분류 손실 연결", "예측 로그확률과 정답 클래스 인덱스로 NLL 손실을 계산하세요.", "F.nll_loss(output, target)")
add("vision-vit", 18, "역전파와 갱신", "손실의 기울기를 계산하고 optimizer로 가중치를 갱신하는 두 줄을 작성하세요.", "loss.backward()\n        optimizer.step()")
add("vision-unet", 4, "정답 Mask 채널", "2차원 정답 mask에 채널 축을 추가해 이미지와 같은 (1, H, W) 형태로 만드세요.", "np.expand_dims(mask, axis=0)")
add("vision-unet", 10, "픽셀 정답과 손실", "학습 루프에서 픽셀별 logits와 정답 mask를 손실 함수에 연결하세요.", "criterion(logits, masks)")
add("vision-ddpm", 17, "노이즈 예측 모델", "noisy image와 시점 t를 모델에 전달해 주입된 noise를 예측하세요.", "denoise_model(x_noisy, t)")
add("vision-ddpm", 17, "노이즈 정답 손실", "L2 학습 분기에서 실제로 주입한 noise와 예측 noise의 평균제곱오차를 계산하세요.", "F.mse_loss(noise, predicted_noise)")

# PDF: metric calculation, not just a metric library call (32–34).
add("vision-resnet", 10, "예측 클래스 선택", "(B, C) logits에서 샘플별 최대 점수의 클래스 인덱스를 선택하세요.", "logits.argmax(dim=1)")
add("vision-vit", 19, "평가 정답 개수", "한 배치의 예측과 정답을 비교해 맞힌 샘플 수를 Python 정수로 계산하세요.", "int(pred.eq(target).sum().item())")
add("vision-vit", 19, "전체 Accuracy", "누적 정답 개수를 전체 평가 샘플 수로 나누어 accuracy를 계산하세요.", "correct_samples / total_samples")

if len(SPECS) > 34:
    raise ValueError("Reviewed Vision scope is capped at 34 questions; review coverage before adding more.")


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
            "isSourceBlank": False,
        })

    for chapter in CHAPTERS:
        chapter["questionCount"] = sum(question["chapterId"] == chapter["id"] for question in vision_questions)

    # Keep the existing chapter/question order and IDs, including other subjects.
    updated_chapters = {chapter["id"]: chapter for chapter in chapters + CHAPTERS}
    chapter_order = list(dict.fromkeys([chapter["id"] for chapter in bank["chapters"]] + list(updated_chapters)))
    updated_questions = {question["id"]: question for question in questions + vision_questions}
    question_order = list(dict.fromkeys([question["id"] for question in bank["questions"]] + list(updated_questions)))
    OUTPUT.write_text(json.dumps({
        "chapters": [updated_chapters[key] for key in chapter_order if key in updated_chapters],
        "cells": cells,
        "questions": [updated_questions[key] for key in question_order if key in updated_questions],
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(vision_questions)} focused Vision questions across {len(CHAPTERS)} notebooks -> {OUTPUT}")


if __name__ == "__main__":
    build()
