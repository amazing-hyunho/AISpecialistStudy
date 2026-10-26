'use client';

import Link from 'next/link';
import { useState } from 'react';
import { originalRecall } from './original';
import '../handbook/handbook.css';

const sections = [
  { title: '총평', marker: '총평:' },
  { title: 'LLM', marker: '### LLM' },
  { title: 'RAG', marker: '### RAG' },
  { title: 'Time / Data', marker: '### Time' },
  { title: 'Vision', marker: 'VISION - CIFAR10' },
  { title: 'On-device', marker: '### On-Device' },
].map((section, i, all) => ({
  ...section,
  text: originalRecall.slice(originalRecall.indexOf(section.marker), all[i + 1] ? originalRecall.indexOf(all[i + 1].marker) : undefined).trim(),
}));

const pastRecalls = [
  {
    exam: '4월 1차 복기',
    items: [
      { topic: 'Multihead Attention + Spam/Ham 분류', file: 'LLM/Chapter_3_Excercise_Attention.ipynb (Cell 3) · Chapter_6_Excercise_Finetuning_Classification.ipynb (Cell 0~1)', detail: 'MultiHeadAttention.forward(헤드 분리·축 이동·점수·재결합), SpamDataset(truncation·padding·Label), 분류 out_head 교체·동결·마지막 토큰 logits[:, -1, :] 손실' },
      { topic: 'RAG (KG + Retrieve)', file: 'RAG/2일차/실습 자료/Code/2. Task_1.ipynb (Cell 16, 23, 25) · 3. Task_2.ipynb (Cell 25, 31, 36)', detail: 'VectorStoreIndex.from_documents → as_retriever(similarity_top_k) → prompt_generator → KGQueryEngine 및 도메인 분기(RAGWithSRKG)' },
      { topic: 'Kernel Pruning', file: 'On-Device/실습/1. Pruning for CNN_answer.ipynb (Cell 33)', detail: 'prune_weight_kernel_level: num_kernels(shape[0]*shape[1]) → round(num_kernels*sparsity) → weight.abs().sum(dim=(2,3), keepdim=True) → kthvalue → mask.expand_as(weight)' },
      { topic: 'ResNet18 + CIFAR-10', file: 'Vision/01_ResNet18_CIFAR10.ipynb (Cell 5, 8, 10, 12)', detail: 'RandomCrop·RandomHorizontalFlip·ToTensor·Normalize 전처리, CIFAR용 3×3 conv1 및 Identity maxpool, accuracy_top1·학습 루프' },
      { topic: '시계열 예측', file: 'TIME/3_4-ts-practice/ts_solution.ipynb (Cell 15, 21, 23, 27, 29, 34, 41, 43)', detail: 'convert_data_into_tensors(Sliding Window), LSTM/Conv1D/RNN/Seq2Seq(RNNRNN) 모델 구현 및 RMSE·MAPE 평가' },
    ],
  },
  {
    exam: '4월 2차 복기',
    items: [
      { topic: '1) LLM (DPO + LoRA)', file: 'LLM/Chapter_7_Exercise_Follow_Instructions_dpo.ipynb (Cell 0, 2) · Chapter_6_Excercise_Finetuning_Classification_LoRA.ipynb (Cell 1~3)', detail: 'tiktoken·policy/reference GPTModel 로드, PreferenceDataset(format_input, chosen/rejected 토큰화) 및 DPO loss, LoRALayer(A·B, alpha/rank 스케일)·LinearWithLoRA·replace_linear_with_lora (※ 보유 자료는 PEFT LoraConfig 대신 직접 구현 사용)' },
      { topic: '2) Vision: DETR / Transformer', file: 'Vision/03_DETR.ipynb (Cell 7, 11, 17, 21~25) · 02_ViT_CIFAR10.ipynb (Cell 8)', detail: 'DETR 노트북은 torch.hub 로드·박스 변환·no-object 제외·hook 시각화를 다루며, MultiHeadAttention/EncoderLayer forward 직접 구현에 가장 가까운 코드는 02_ViT_CIFAR10.ipynb Cell 8의 Attention.forward 및 Transformer.forward(PreNorm + Residual)' },
      { topic: '3) On-device: Quantization', file: 'On-Device/실습/2. Quantization for CNN_answer.ipynb (Cell 24, 33, 41, 43, 55, 63)', detail: 'linear_quantize(fp/scale → round → +zero_point → clamp), get_quantization_scale_and_zero_point, per-tensor/per-channel 가중치 양자화, quantized_linear/conv2d 출력 재양자화' },
      { topic: '4) Data Model: Sliding Window & Conv1DModel', file: 'TIME/3_4-ts-practice/ts_solution.ipynb (Cell 15, 29)', detail: 'convert_data_into_tensors(data_seq[i:i+sequence_length], data_seq[i+sequence_length, 0] → float32 Tensor), Conv1DModel.forward(transpose(1,2) → conv1d → transpose(1,2) → fc)' },
      { topic: '5) LLM Application: Retriever + KG + Prompt Generator', file: 'RAG/2일차/실습 자료/Code/2. Task_1.ipynb (Cell 16, 23) · 3. Task_2.ipynb (Cell 25, 35, 36)', detail: 'LlamaIndexRetriever + KGQueryEngine 결합/분기(RAGWithSRKG) 및 top_k_chunks 기반 prompt_generator 구현' },
    ],
  },
  {
    exam: '5월 복기',
    items: [
      { topic: 'GPT - DPO', file: 'LLM/Chapter_7_Exercise_Follow_Instructions_dpo.ipynb (Cell 0, 2)', detail: 'PreferenceDataset, compute_logprobs(labels[:, 1:], logits[:, :-1, :], gather), compute_dpo_loss(-F.logsigmoid(beta * logits))' },
      { topic: 'NGCF 추천', file: 'TIME/7_8-recsys-practice/RecSys_GCF_sol.ipynb (Cell 13, 14)', detail: 'NGCFLayer(degree 정규화 1/sqrt(deg[src]*deg[dst]), W1(src)+W2(src*dst), index_add_ 집계), NGCF(레이어 통과 및 torch.concat(layer_outputs, dim=-1))' },
      { topic: 'COCO (DETR 추론)', file: 'Vision/03_DETR.ipynb (Cell 5, 7, 11, 15, 17)', detail: 'COCO 클래스·샘플 이미지 추론, ImageNet 정규화, pred_logits.softmax(-1)[0, :, :-1]로 no-object 제외, confidence>0.9 필터링 및 rescale_bboxes' },
      { topic: 'Channel-based Pruning', file: 'On-Device/실습/1. Pruning for CNN_answer.ipynb (Cell 35)', detail: 'prune_weight_channel_level: 입력 채널 수(weight.shape[1]) → round(num_channels*sparsity) → weight.abs().sum(dim=(0,2,3), keepdim=True) → kthvalue → expand_as' },
      { topic: 'RAG', file: 'RAG/1일차·2일차 실습 코드 전반', detail: 'VectorStoreIndex, Retriever, prompt_generator, KG 결합' },
    ],
  },
  {
    exam: '6월 복기',
    items: [
      { topic: 'Neural Collaborative Filtering (NCF)', file: 'TIME/7_8-recsys-practice/RecSys_NCF.ipynb (Cell 7, 8, 10, 14, 18)', detail: 'LabelEncoder·stratified train_test_split, Neural_Collaborative_Filtering.forward(user/movie Embedding → torch.cat(dim=1) → fc1·relu·fc2), MSE·RMSE 평가' },
      { topic: 'GPT', file: 'LLM/Chapter_4_Excercise_GPT.ipynb (Cell 1~4)', detail: 'MultiHeadAttention, LayerNorm·GELU·FeedForward·TransformerBlock, GPTModel(tok_embeds+pos_embeds, trf_blocks, final_norm, out_head), generate_text_simple(logits[:,-1,:], argmax, cat)' },
      { topic: 'ResNet18', file: 'Vision/01_ResNet18_CIFAR10.ipynb (Cell 5, 8, 10)', detail: 'build_resnet18_for_cifar10(conv1, maxpool=Identity, fc), CIFAR-10 transforms, 학습·평가 루프' },
      { topic: 'Kernel-level Pruning', file: 'On-Device/실습/1. Pruning for CNN_answer.ipynb (Cell 33)', detail: 'prune_weight_kernel_level: C_out×C_in 커널 수 계산 및 공간 축 dim=(2,3) 절댓값 합산·kthvalue·mask 확장' },
      { topic: 'MCP Client 선언부 + RAG', file: 'RAG/2일차/실습 자료/Code/4_RAG_framework_evaluation_with_MCP.ipynb (Cell 37, 42, 46, 55)', detail: 'BasicMCPClient(external_mcp_server) → McpToolSpec(client=mcp_client) → await mcp_tool.to_tool_list_async() → FunctionAgent 생성·Context·run' },
    ],
  },
];

export default function ExamRecall() {
  const [raw, setRaw] = useState(false);
  return <main className="handbook">
    <header className="hb-top"><Link href="/">← 문제은행</Link><Link href="/final-handbook/">암기 핸드북</Link><button onClick={() => window.print()}>인쇄 / PDF 저장</button></header>
    <h1>시험 복기 아카이브 (4월·5월·6월·9월)</h1>
    <p className="hb-intro">직접 적어주신 9월 복기 원문과 4월(1·2차)·5월·6월 기출 복기 주제의 Study 노트북 매핑을 함께 보관한 탭입니다. 공식 시험지·공식 정답이 아닌 사용자 기억 기반 기록입니다.</p>
    <section className="hb-cell" id="recall-past">
      <h2>4월(1·2차) · 5월 · 6월 복기 주제 및 Study 매핑</h2>
      {pastRecalls.map(group => <div key={group.exam} style={{ marginBottom: '1.25rem' }}>
        <h3>{group.exam}</h3>
        <ol className="hb-steps">{group.items.map(item => <li key={item.topic}>
          <h4>{item.topic}</h4>
          <p className="hb-meta">{item.file}</p>
          <p>{item.detail}</p>
        </li>)}</ol>
      </div>)}
    </section>
    <h2>2026-09 시험 복기 원문</h2>
    <aside className="hb-flow"><strong>원문과 해설 구분</strong><p>내용·불확실한 표현·코드 표기를 임의로 고치지 않았습니다. 기본 보기는 밑줄 등의 Markdown 이스케이프만 풀어 읽기 쉽게 표시하며, 원문 보기에서는 전달된 표기를 확인할 수 있습니다. 문법과 들여쓰기가 불완전한 부분도 있어 그대로 실행할 수 있는 코드라는 뜻은 아닙니다.</p></aside>
    <div className="hb-controls"><button aria-pressed={raw} onClick={() => setRaw(value => !value)}>{raw ? '과목별 읽기 보기' : '원문 전체 보기'}</button></div>
    {raw ? <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{originalRecall}</pre> : <>
      <nav className="hb-index" aria-label="복기 과목 목차">{sections.map((section, i) => <a key={section.title} href={`#recall-${i}`}>{section.title}</a>)}</nav>
      {sections.map((section, i) => <section className="hb-cell" id={`recall-${i}`} key={section.title}>
        <h2>{section.title}</h2>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{section.text.replace(/\\([_~*#])/g, '$1')}</pre>
        <a className="hb-back" href="#">↑ 목차로</a>
      </section>)}
    </>}
    <footer className="hb-footer">사용자 제공 복기 원문 보관 · 문제은행 보강과 암기 해설은 별도 페이지에서 관리합니다.</footer>
  </main>;
}
