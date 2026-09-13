# RAG 출제기준 보강 — 2026-09-13

사용자가 제시한 PDF의 두 기준: RAG 구성요소·주요 흐름·활용, llama-index·MCP 등 관련 library 활용.
기존 18문제의 ID·정답을 유지하고 부족한 연결 단계 10개만 추가하여 총 28문제로 구성했다.

| 기준 | 기존 범위 | 추가 범위 (rag-019~028) |
| --- | --- | --- |
| 구성·흐름·활용 | 벡터 인덱스, retriever, prompt_generator, Chat Completion, KG 질의와 분기 | 019~021: 문서 읽기→분할→Node. 023~025: 검색 본문 추출→질문·근거 메시지→Reader 응답 생성 |
| llama-index 활용 | VectorStoreIndex, as_retriever, retrieve | 019~023: SimpleDirectoryReader, SentenceSplitter, get_nodes_from_documents, OpenAIEmbedding, node.get_content |
| MCP 활용 | BasicMCPClient, 도구 목록 조회, FunctionAgent, MCP 질의 | 026~028: McpToolSpec, Context, agent.run handler와 최종 응답 구분 |

출처는 현재 `Study/RAG` 안의 지정된 Code 폴더 4개 노트북이다.
완성 코드 위의 `YOUR CODE HERE` 안내만으로 원래 어느 표현이 빈칸이었는지 단정할 수 없으므로, 추가 문제의 `isSourceBlank`는 false이며 별표를 붙이지 않는다.
TODO, 설치 명령, 서버 주소·API 키, 단순 파일 파싱을 새 문제로 출제하지 않았다.
서버 주소·키를 제외하는 기존 원문 정리 규칙도 유지한다.

기출에서 강조된 Vector DB/KG, llama-index 검색, prompt_generator의 기존 문제는 그대로 남긴다.
실습의 KG 코드는 직접 정의한 query engine/API 연동이므로 이를 LlamaIndex 내장 KG 인덱스 구현으로 설명하지 않는다.
기존 혼합 RAG의 금융/비금융 분기도 코드 그대로 유지한다.
이 구성은 기준에 맞춘 학습용 선별이며 실제 출제를 보장하지 않는다.

각 추가 문제에는 코드 역할·흐름·혼동하기 쉬운 점과 암기 포인트를 작성했다.
퀴즈 인라인 해설과 핸드북이 같은 해설을 공유한다.
`node scripts/test-rag-bank.cjs`로 로컬 노트북과 원문 일치, 빈칸 위치·겹침, 설명, 개수, 별표 정책을 검사한다.
