"""Run AFTER any subject generators. Append stable, source-verified recall gaps.

Never overwrites Study. Re-running is idempotent; old answers and IDs survive.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "ExamTrainer/app"
specs = []

def add(id, chapter, file, cell, source_id, topic, prompt, answer, why, memory, occurrence=0):
    specs.append(dict(id=id, chapter=chapter, file=file, cell=cell, source_id=source_id,
                      topic=topic, prompt=prompt, answer=answer, why=why, memory=memory, occurrence=occurrence))

MHA = 'LLM/llm_from_scratch/Chapter_3_Attention_Mechanisms_KR.ipynb'
GPT = 'LLM/llm_from_scratch/images/Chapter_4_Excercise_GPT.ipynb'
TS = 'TIME/3_4-ts-practice/ts_solution.ipynb'
PRUNE = 'On-Device/실습/1. Pruning for CNN_answer.ipynb'

for id, name in [('llm-089', 'keys'), ('llm-090', 'values'), ('llm-091', 'queries')]:
    add(id, 'llm-03a', MHA, 136, 'ch3-cell-136', f'MHA {name} 헤드 분리',
        f'{name}: (B,T,D_out)를 (B,T,H,D_head)로 바꾸세요. D_out = H × D_head입니다.',
        f'{name}.view(b, num_tokens, self.num_heads, self.head_dim)',
        'view는 원소 수를 유지하며 마지막 특징 축을 헤드 수와 헤드 차원으로 나눕니다. Q/K/V 세 텐서에 같은 형태 변환을 적용합니다.',
        '(B,T,D) → view(B,T,H,D/H).')
add('llm-092', 'llm-03a', MHA, 136, 'ch3-cell-136', 'MHA 헤드 축 이동',
    'keys의 (B,T,H,D_head)를 (B,H,T,D_head)로 바꾸세요.', 'keys.transpose(1, 2)',
    '시간 축 1과 헤드 축 2를 교환해야 헤드별 토큰 행렬 곱을 수행할 수 있습니다. view로 축의 의미를 바꾸는 것과 구분합니다.', '헤드가 시간 앞으로: transpose(1,2).')
add('llm-093', 'llm-03a', MHA, 136, 'ch3-cell-136', 'MHA 헤드 재결합',
    'transpose 후 (B,T,H,D_head)를 연속 메모리로 정리하고 (B,T,D_out)으로 합치세요.',
    'context_vec.contiguous().view(b, num_tokens, self.d_out)',
    'transpose 결과는 비연속 메모리일 수 있어 contiguous 후 view로 헤드와 특징 축을 합칩니다. 출력 토큰 수는 변하지 않습니다.', 'contiguous → view(B,T,D_out).')
add('llm-094', 'llm-04', GPT, 2, 'ch4-cell-2', 'MultiHeadAttention 구성',
    '입출력 차원을 emb_dim으로 유지하고 context_length·n_heads·drop_rate·qkv_bias 설정을 연결하세요.',
    'MultiHeadAttention(\n            d_in=cfg["emb_dim"],\n            d_out=cfg["emb_dim"],\n            context_length=cfg["context_length"],\n            num_heads=cfg["n_heads"],\n            dropout=cfg["drop_rate"],\n            qkv_bias=cfg["qkv_bias"])',
    '설정 딕셔너리의 이름을 생성자 인자에 연결합니다. 출력 차원이 입력 emb_dim과 같아야 주변 residual 덧셈이 가능합니다.', 'n_heads → num_heads, drop_rate → dropout.')
add('llm-095', 'llm-04', GPT, 4, 'ch4-cell-4', '생성 모델 forward',
    'no_grad 블록에서 현재 입력 idx_cond를 모델에 넣어 logits를 얻으세요.', 'model(idx_cond)',
    '현재 context 범위로 자른 입력을 모델에 전달합니다. no_grad는 기울기 기록을 끄고 모델 출력은 (B,T,V) logits입니다.', '입력 idx_cond → model → logits(B,T,V).')
add('rag-029', 'rag-d1-01', 'RAG/1일차/실습 자료/Code/1. Llama_index.ipynb', 32, 'd1_llama-cell-32', 'Query Engine 구성',
    '이미 만든 index에서 검색과 응답 생성을 수행할 query engine을 만드세요.', 'index.as_query_engine()',
    'retriever는 관련 노드를 가져오고 query engine은 검색과 응답 합성을 묶는 질의 인터페이스입니다. from_documents로 만든 index에서 구성합니다.', 'index → as_query_engine → query.')
add('data-034', 'data-ts', TS, 41, 'data-ts-cell-41', 'Encoder 입력 구간',
    '시점 i부터 sequence_length 길이의 과거 관측을 입력에 추가하세요.', 'data[i:i + sequence_length]',
    'slice의 끝은 포함하지 않습니다. 현재 시작점에서 과거 입력 길이만큼 자르며 타깃은 이 구간 다음부터 시작합니다.', '입력: [i : i+L].')
add('data-035', 'data-ts', TS, 41, 'data-ts-cell-41', 'Decoder 정답 구간',
    '입력 직후부터 target_len 길이의 미래 관측을 정답으로 선택하세요.',
    'data[i + sequence_length : \\\n                           i + sequence_length + target_len]',
    '입력 끝 다음부터 미래 T개를 정답으로 묶습니다. 본문 range는 강의 원문을 유지했으며 가능한 마지막 창 하나를 포함하는 일반 구현과는 상한이 다를 수 있습니다.', '정답: [i+L : i+L+T].')
for id, topic, prompt, answer, why, memory in [
    ('data-036','Encoder 상태 전달','source를 encoder에 넣어 decoder 초기 hidden state를 얻으세요.','self.encoder(source)','encoder가 반환한 h를 decoder에 넘겨 과거 입력의 정보를 전달합니다.','source → encoder → h.'),
    ('data-037','Decoder 초기 입력','(B,L,F) source에서 마지막 관측을 고르고 시간 축을 유지해 (B,1,F)로 만드세요.','source[:, -1, :].unsqueeze(1)','마지막 시점을 고르면 (B,F)이므로 unsqueeze(1)로 RNN 입력에 필요한 길이 1의 시간 축을 만듭니다.','마지막 관측 → unsqueeze(1).'),
    ('data-038','Decoder 한 스텝','직전 입력과 hidden state로 한 스텝을 예측하고 새 상태를 받으세요.','self.decoder(input, h)','decoder는 예측 out과 다음 hidden state를 함께 반환합니다. 반복마다 갱신한 h를 이어 사용합니다.','out,h = decoder(input,h).'),
    ('data-039','시점별 출력 저장','(B,1,F) 예측에서 길이 1의 시간 축만 제거하여 리스트에 저장하세요.','out.squeeze(1)','배치 크기가 1이어도 배치 축을 보존하도록 squeeze의 축을 1로 지정합니다.','(B,1,F) → squeeze(1) → (B,F).'),
    ('data-040','예측을 다음 입력으로','현재 예측 out을 다음 decoder 단계의 입력으로 사용하세요.','input = out','정답을 넣는 teacher forcing 대신 이전 예측을 다시 입력하는 자기회귀 예측입니다.','다음 input은 방금 만든 out.'),
    ('data-041','예측 시간 축 생성','리스트의 (B,F) 예측들을 새 시간 축으로 쌓아 (B,target_len,F)를 만드세요.','torch.stack(predictions, dim=1)','stack은 새 차원을 만들고 cat은 기존 차원을 늘립니다. 시간별 예측 목록은 새 시간 축 1에 쌓습니다.','시점 목록 → stack(dim=1).'),
]:
    add(id,'data-ts',TS,43,'data-ts-cell-43',topic,prompt,answer,why,memory)
add('data-042','data-ts',TS,41,'data-ts-cell-41','학습 데이터 dtype','입력 창 목록을 float32 NumPy 배열로 만드세요.','np.array(features, dtype=np.float32)',
    '배치·시간·특징 형태를 갖는 실수 배열로 변환합니다. 이어지는 torch.tensor에서 실습의 float32 모델 입력을 준비합니다.','창 목록 → float32 배열 → Tensor.')
for id, topic, prompt, answer, why, memory in [
    ('data-043','Sliding Window 범위','전체 시계열 길이에서 입력 창 길이를 뺀 반복 상한을 작성하세요.','len(data_seq) - sequence_length','시점 i부터 sequence_length개의 입력과 직후 1시점 타깃을 만들 수 있는 시작 위치 개수입니다.','시작 위치 수: len(data_seq) - sequence_length.'),
    ('data-044','Sliding Window 입력','시점 i부터 sequence_length 길이의 과거 구간을 입력 리스트에 추가하세요.','data_seq[i:i + sequence_length]','현재 시작점 i에서 과거 sequence_length 시점만큼 잘라 하나의 입력 윈도우로 만듭니다.','입력 창: data_seq[i:i + sequence_length].'),
    ('data-045','다음 시점 정답 추출','입력 구간 바로 다음 시점(i + sequence_length)의 첫 번째 특성값을 정답으로 선택하세요.','data_seq[i + sequence_length, 0]','단일 시점 예측에서는 입력 창이 끝난 직후 시점의 대상 변수를 타깃으로 사용합니다.','타깃 시점: data_seq[i + sequence_length, 0].'),
    ('data-046','입력 Tensor 변환','NumPy 입력 배열 features를 float32 PyTorch Tensor로 변환하세요.','torch.tensor(features, dtype=torch.float32)','신경망 선형·순환·합성곱 계층과 연산할 수 있도록 float32 Tensor로 변환합니다. shape는 (N, L, F)입니다.','features → torch.tensor(..., dtype=torch.float32).'),
    ('data-047','정답 Tensor 변환','NumPy 정답 배열 labels를 float32 PyTorch Tensor로 변환하세요.','torch.tensor(labels, dtype=torch.float32)','회귀 손실(MSELoss 등) 계산을 위해 타깃도 입력과 같은 float32 Tensor로 맞춥니다. shape는 (N,)입니다.','labels → torch.tensor(..., dtype=torch.float32).'),
]:
    add(id,'data-ts',TS,15,'data-ts-cell-15',topic,prompt,answer,why,memory)
for id, topic, prompt, answer, why, memory, occ in [
    ('data-048','Conv1D 입력 축 변환','(B, L, C_in) 시계열 입력을 Conv1d가 요구하는 (B, C_in, L)로 바꿀 transpose 식을 작성하세요.','x.transpose(1, 2)','PyTorch nn.Conv1d는 채널 축이 시간 축보다 앞선 (B, C_in, L) 입력을 기대하므로 1번 시간 축과 2번 특성 축을 교환합니다.','Conv1d 전: (B,L,C) → transpose(1,2) → (B,C,L).',0),
    ('data-049','Conv1D 연산 적용','축을 바꾼 입력 x를 1D 합성곱 레이어에 통과시키세요.','self.conv1d(x)','시간 축을 따라 커널이 이동하며 지역 시간 패턴을 추출해 (B, hidden_size, L_out) 출력을 만듭니다.','합성곱: x = self.conv1d(x).',0),
    ('data-050','Linear 입력 축 복원','합성곱 결과 (B, C_out, L_out)을 선형층 적용을 위해 (B, L_out, C_out)으로 되돌리는 transpose 식을 작성하세요.','x.transpose(1, 2)','nn.Linear는 마지막 차원을 입력 특성(in_features)으로 처리하므로 채널 축을 다시 마지막 축으로 옮깁니다.','Conv1d 후: (B,C,L) → transpose(1,2) → (B,L,C).',1),
    ('data-051','Conv1D 최종 출력','시점별 은닉 표현에 선형층 fc를 적용해 예측값을 반환하세요.','self.fc(x)','마지막 축 hidden_size를 1차원으로 투영해 (B, L_out, 1) 시계열 예측 출력을 얻습니다.','선형 투영: return self.fc(x).',0),
]:
    add(id,'data-ts',TS,29,'data-ts-cell-29',topic,prompt,answer,why,memory,occ)
add('vision-035','vision-vit','Vision/02_ViT_CIFAR10.ipynb',8,'vision-vit-cell-8','FFN Residual',
    'FFN으로 변환한 결과에 같은 shape의 원래 입력을 더하세요.','ff(x) + x',
    'Attention residual 다음의 FFN도 입력과 출력 shape를 맞춰 잔차 덧셈을 수행합니다. torch.cat으로 채널을 늘리는 연결이 아닙니다.','Attention도 +x, FFN도 +x.')
add('vision-036','vision-resnet','Vision/01_ResNet18_CIFAR10.ipynb',5,'vision-resnet-cell-5','학습 이미지 정규화',
    '학습 ToTensor 다음에 CIFAR10 채널 평균·표준편차로 정규화하세요.','T.Normalize(CIFAR10_MEAN, CIFAR10_STD)',
    '각 채널에서 평균을 빼고 표준편차로 나눕니다. 학습·평가에 같은 통계를 사용하되 무작위 증강은 학습 쪽에 둡니다.','증강 → ToTensor → Normalize.')
add('vision-037','vision-resnet','Vision/01_ResNet18_CIFAR10.ipynb',5,'vision-resnet-cell-5','Transform 순서 구성',
    '리스트에 나열한 transform을 순서대로 실행하는 torchvision 래퍼를 선택하세요.','T.Compose',
    'Compose는 crop, flip, Tensor 변환, Normalize를 리스트 순서대로 연결합니다. 이 빈칸은 호출 이름만 입력하고 뒤의 리스트는 유지합니다.','T.Compose([...])로 순차 적용.')
for id, topic, prompt, answer, why, memory in [
    ('ondevice-061','입력 채널 수','weight가 (C_out,C_in,K_h,K_w)일 때 입력 채널 수를 구하세요.','weight.shape[1]','축 1이 입력 채널입니다. 여기서는 groups=1인 일반 convolution 형태를 전제로 합니다.','입력 채널 축은 1.'),
    ('ondevice-062','제거할 채널 수','입력 채널 수에 sparsity를 곱해 반올림하세요.','round(num_channels * sparsity)','원소 수가 아니라 채널 수에 목표 희소도를 적용합니다. 강의 threshold 구현은 반올림 결과 0인 경우 추가 처리가 필요할 수 있습니다.','round(채널 수 × sparsity).'),
    ('ondevice-063','채널 중요도 합산','(C_out,C_in,K_h,K_w)에서 입력 채널 축만 남겨 절댓값을 합산하세요. 결과는 (1,C_in,1,1)입니다.','weight.abs().sum(dim=(0, 2, 3), keepdim=True)','출력 채널과 커널 공간 축을 합산하고 입력 채널 축을 보존합니다. keepdim은 이후 broadcast에 필요한 크기 1의 축들을 남깁니다.','남길 축 1, 합칠 축 (0,2,3).'),
    ('ondevice-064','채널 mask 확장','(1,C_in,1,1) mask를 weight와 같은 크기로 확장하세요.','mask.expand_as(weight)','채널별 유지 여부를 해당 채널의 모든 가중치 위치에 적용합니다. 이 코드는 가중치를 0으로 만들며 구조 자체의 채널 수를 줄이지는 않습니다.','채널 mask → expand_as(weight).'),
]:
    add(id,'ondevice-cnn-pruning',PRUNE,35,'ondevice-cnn-pruning-cell-35',topic,prompt,answer,why,memory)
for id, topic, prompt, answer, why, memory in [
    ('ondevice-065','전체 커널 수','weight가 (C_out,C_in,K_h,K_w)일 때 2D 커널(K_h×K_w)의 총 개수를 구하세요.','weight.shape[0] * weight.shape[1]','각 출력 채널과 입력 채널 쌍마다 하나의 2D 커널이 존재하므로 전체 커널 수는 C_out × C_in입니다.','커널 수 = shape[0] × shape[1].'),
    ('ondevice-066','제거할 커널 수','전체 커널 수에 sparsity를 곱해 반올림하세요.','round(num_kernels * sparsity)','개별 가중치 원소나 채널 수가 아니라 커널 개수(num_kernels)를 기준으로 제거 개수를 정합니다.','round(커널 수 × sparsity).'),
    ('ondevice-067','커널 중요도 합산','(C_out,C_in,K_h,K_w)에서 각 커널의 공간 축만 합산해 (C_out,C_in,1,1) 중요도를 구하세요.','weight.abs().sum(dim=(2, 3), keepdim=True)','출력·입력 채널 축(0, 1)은 남기고 커널 높이·너비 축(2, 3)만 절댓값 합산합니다. 채널 프루닝의 dim=(0, 2, 3)과 구분하세요.','커널 단위는 공간 축 (2,3)만 합산.'),
    ('ondevice-068','커널 Pruning Threshold','중요도를 1차원으로 펼쳐 제거할 커널 수번째 기준값(threshold)을 구하세요.','torch.kthvalue(importance.flatten(), num_pruned_kernels)[0]','kthvalue는 오름차순 k번째 값과 인덱스를 반환하므로 [0]으로 값만 꺼내 커널 제거 경계값으로 사용합니다.','kthvalue(importance.flatten(), num_pruned_kernels)[0].'),
    ('ondevice-069','커널 유지 Mask','중요도가 threshold보다 큰 커널만 유지하는 boolean mask를 만드세요.','importance > threshold','임계값보다 큰 커널 위치는 True(1), 작거나 같은 커널은 False(0)가 되어 커널 단위로 유지 여부를 결정합니다.','유지 마스크: importance > threshold.'),
    ('ondevice-070','커널 Mask 확장','(C_out,C_in,1,1) 커널 mask를 원래 가중치 shape로 확장하세요.','mask.expand_as(weight)','각 커널의 유지 여부를 K_h × K_w 공간 원소 전체에 똑같이 복제해 weight.mul_(mask)가 동작하도록 맞춥니다.','커널 mask → expand_as(weight).'),
]:
    add(id,'ondevice-cnn-pruning',PRUNE,33,'ondevice-cnn-pruning-cell-33',topic,prompt,answer,why,memory)

def build():
    bank = json.loads((APP/'question-bank.json').read_text(encoding='utf-8'))
    explanations = {}
    for s in specs:
        nb = json.loads((ROOT/'Study'/s['file']).read_text(encoding='utf-8'))
        cell = nb['cells'][s['cell']]
        assert cell['cell_type'] == 'code'
        raw = ''.join(cell['source'])
        assert s['answer'] in raw, s['id']
        source = bank['cells'].get(s['source_id'], {}).get('source')
        if source is None:
            source = '\n'.join(line.rstrip() for line in raw.splitlines() if line.strip() != '### YOUR CODE HERE ###').strip()
        assert source.count(s['answer']) > s['occurrence'], s['id']
        bank['cells'].setdefault(s['source_id'], dict(source=source, cell=s['cell'], answerSource=Path(s['file']).name))
        chapter = next(c for c in bank['chapters'] if c['id'] == s['chapter'])
        q = dict(id=s['id'], subject=chapter['subject'], chapterId=chapter['id'], chapterNumber=chapter['number'],
                 chapterTitle=chapter['title'], file=chapter['file'], topic=s['topic'], prompt=s['prompt'],
                 answer=s['answer'], occurrence=s['occurrence'], sourceId=s['source_id'], isSourceBlank=False)
        existing = next((i for i, old in enumerate(bank['questions']) if old['id']==q['id']), None)
        if existing is None: bank['questions'].append(q)
        else: bank['questions'][existing] = q
        explanations[s['id']] = dict(why=s['why'], memory=s['memory'])
    for c in bank['chapters']:
        c['questionCount'] = sum(q['chapterId']==c['id'] for q in bank['questions'])
    (APP/'question-bank.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2),encoding='utf-8')
    (APP/'recall-explanations.json').write_text(json.dumps(explanations,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Added/updated {len(specs)} source-backed recall/shape questions; total {len(bank["questions"])}')

if __name__ == '__main__': build()
