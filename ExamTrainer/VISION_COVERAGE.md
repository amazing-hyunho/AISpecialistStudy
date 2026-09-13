# Vision 출제기준 대조 — 2026-09-13

근거: `Study/AI인증시험_출제포인트.pdf`의 Vision 항목과 `Study/Vision`의 6개 노트북.
기존 18문제의 ID·정답은 유지하고 16문제(vision-019~034)를 추가했다.
전체 34문제는 실습 코드에서 선별한 문제이며, 원본 빈칸을 뜻하는 별표는 붙이지 않는다.
시험 출제를 보장하는 목록이 아니라 PDF 기준을 실습 코드와 연결한 학습용 구성이다.

| PDF 기준 | 기존 문제 | 추가 문제와 역할 |
| --- | --- | --- |
| 주요 layer의 의미·구성·동작·활용 | 002~006, 008, 010, 013~015, 017: CNN stem, QKV, CLS, skip, 확산·생성 활용 | 023: patch_dim → 토큰 차원 투영. 024: Attention 잔차 덧셈 |
| 결과와 정답을 학습으로 연결 (모델 원리의 하위 항목) | 011: BCEWithLogitsLoss, 014: noisy 학습 입력 | 025~027: log_softmax → NLL → backward·step. 029: logits와 mask 손실. 030~031: 시점 조건 노이즈 예측과 실제 noise를 이용한 MSE |
| 학습·평가 목적에 맞는 데이터 구성 | 001, 007, 012: 증강·정규화·mask 변환 | 021~022: 평가 전처리와 학습 배치. 028: mask를 (1,H,W)로 구성 |
| torchvision.transforms 활용 | 001, 007: RandomCrop, ImageNet Normalize | 019~021: RandomHorizontalFlip, ToTensor, 평가용 Normalize 및 학습·평가 차이 |
| 평가 Metric 원리와 방법 | 016, 018: Top-1 accuracy, confusion matrix | 032~034: 클래스 argmax → 정답 개수 누적 → 전체 샘플 수로 나누기 |

번호는 `vision-` 뒤 세 자리이며, 기준 간 중복 대응을 허용한다.
새 문제의 코드 해설은 클래스/채널/배치 축, logits와 확률·로그확률의 차이,
분류/분할/확산의 서로 다른 정답, 배치 크기가 다른 평가에서의 정확도 집계를 설명한다.
퀴즈 인라인 해설과 핸드북에서 동일한 해설을 사용한다.

## 범위 제한

- DETR 노트북은 사전학습 모델의 추론·시각화 중심이므로 없는 탐지 학습 코드를 만들지 않았다.
- 원본에 없는 IoU, Dice, mAP, FID 구현을 추가 문제로 만들어 넣지 않았다. 현재 metric 구성은 원본의 accuracy와 confusion matrix에 한정된다.
- 같은 backward·step을 모델마다 반복 출제하지 않고 ViT 학습 루프로 대표했다.
- TODO/pass 블록을 새 문제로 만들지 않았으며 강의자료 자체를 수정하지 않았다.

## 검증

`node scripts/test-vision-bank.cjs`: 로컬 강의 노트북 필요. 34문제의 코드 출처·빈칸 위치·중복·해설·챕터 개수·별표를 검사한다.
`node scripts/test-inline-quiz.cjs`: 기존 인라인 입력과 채점 동작 회귀검사.
