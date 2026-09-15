// User-provided recollection. Preserve wording, markdown and incomplete formatting.
// Do not silently correct this archival copy or mix generated questions into it.
export const originalRecall = String.raw`2026-09 시험문제 복기

총평:
생각보다 구체적으로 가이드가 나와, 수식 외울 필요는 없어보이고, tensor를 잘 써야할 것으로 보임.

### LLM##\#

1. MultiHeadAttention QKV 계산 후, 헤드 나누기

# (b, num\_tokens, d\_out) -> (b, num\_tokens, num\_heads, head\_dim)

keys = keys.view(b, num\_tokens, self.num\_heads, self.head\_dim)
values = values.view(b, num\_tokens, self.num\_heads, self.head\_dim)
queries = queries.view(b, num\_tokens, self.num\_heads, self.head\_dim)

2. self.att, MultiHeadAttention 할당하기
   self.att = MultiHeadAttention(
   d\_in=cfg["emb\_dim"],
   d\_out=cfg["emb\_dim"],
   context\_length=cfg["context\_length"],
   num\_heads=cfg["n\_heads"],
   dropout=cfg["drop\_rate"],
   qkv\_bias=cfg["qkv\_bias"])

3. self.out\_head 구현

self.out\_head = nn.Linear(cfg["emb\_dim"], cfg["vocab\_size"], bias=False)

4. 토큰 임베딩과 위치 임베딩 합산

# region [토큰 임베딩과 위치 임베딩 합산]

# TODO

x = tok\_embeds + pos\_embeds



5. 모델 예측 (기울기 계산 불필요)
   with torch.no\_grad():
   logits = model(idx\_cond)

6. generate\_text

# 마지막 타임스텝의 예측값만 가져옴 (다음 단어 예측이므로)

# (batch, n\_token, vocab\_size) -> (batch, vocab\_size)

logits = logits[:, -1, :]

# 가장 확률(로짓값)이 높은 토큰 선택 (Greedy Decoding)

idx\_next = torch.argmax(logits, dim=-1, keepdim=True)

# 예측된 토큰을 현재 시퀀스 뒤에 이어 붙임

idx = torch.cat((idx, idx\_next), dim=1)

return idx

### RAG

비교적 간단한게 많이 나옴.

index = VectorStoreIndex.from\_documents(documents)
query\_engine = index.as\_query\_engine()
messages 형식
{"role":"user", "content":"\~\~\~\~"}

### Time - Data (RNNCNN)

1. enc\_dec sequence 구성

- features.append(data[i:i + sequence\_length])
  labels.append(data[i + sequence\_length : \
  i + sequence\_length + target\_len])

2. forward 구현
   defcreate\_enc\_dec\_sequences(data):
   features, labels = [], []
   for i inrange(len(data) - sequence\_length - target\_len):
   features.append(data[i:i + sequence\_length])
   labels.append(data[i + sequence\_length : \
   i + sequence\_length + target\_len])

features = np.array(features, dtype=np.float32)
labels = np.array(labels, dtype=np.float32)

classRNNRNN(nn.Module):
def\_\_init\_\_(self, input\_size, hidden\_size, num\_layers):
super(RNNRNN, self).**init**()
self.encoder = EncoderRNN(input\_size, hidden\_size, num\_layers)
self.decoder = DecoderRNN(input\_size, hidden\_size, num\_layers)

defforward(self, source, target\_len):
h = self.encoder(source)
predictions = []
input = source[:, -1, :].unsqueeze(1)
for t inrange(target\_len):
out, h = self.decoder(input, h)
predictions.append(out.squeeze(1))
input = out
outputs = torch.stack(predictions, dim=1)

return outputs

model\_ = RNNRNN(input\_size, hidden\_size, num\_layers).to(device)
print(model\_)

VISION - CIFAR10

1. train transform 구현 (Dataset)
   train\_tfms = T.Compose([ # train transform(augmentation 포함)
   T.RandomCrop(32, padding=4), # 32x32를 padding 후 random crop
   T.RandomHorizontalFlip(), # 좌우 반전
   T.ToTensor(), # PIL -> torch tensor (C,H,W), 0\~1
   T.Normalize(CIFAR10\_MEAN, CIFAR10\_STD), # 정규화, -2.5\~2.5
   ])

2. Transformer residual 연결
   defforward(self, x):
   for attn, ff inself.layers:
   x = attn(x) + x # Residual 연결: Attention 결과를 입력에 더해 정보 보존
   x = ff(x) + x # Residual 연결: FFN 결과를 입력에 더해 정보 보존
   return x

### On-Device##\#

1. Channel-level pruning?

무튼 num\_pruned\_channel (round 쓰는거)
importance (torch의 abs, sum 쓰라고 했음)

# 프루닝할 채널 수 계산

num\_channels = weight.shape[1]
num\_pruned\_channels = round(num\_channels \* sparsity)

# 각 채널의 중요도를 절댓값 합으로 계산

# (출력 채널, 커널 높이, 커널 너비에 대해 합산)

importance = weight.abs().sum(dim=(0, 2, 3), keepdim=True)
`;
