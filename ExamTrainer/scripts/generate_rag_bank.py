"""Append the curated RAG code-cell cloze bank to the static question bank."""

from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
RAG_ROOT = REPO_ROOT / "Study" / "RAG"
OUTPUT = REPO_ROOT / "ExamTrainer" / "app" / "question-bank.json"

CHAPTERS = [
    {"id": "rag-d1-01", "subject": "RAG", "number": "D1-01", "title": "LlamaIndex Basics", "file": "1. Llama_index.ipynb"},
    {"id": "rag-d1-02", "subject": "RAG", "number": "D1-02", "title": "RAG Pipeline", "file": "2. RAG.ipynb"},
    {"id": "rag-d2-01", "subject": "RAG", "number": "D2-01", "title": "Data Preprocessing", "file": "1. Data_preprocessing.ipynb"},
    {"id": "rag-d2-02", "subject": "RAG", "number": "D2-02", "title": "Search Retrieval", "file": "2. Task_1.ipynb"},
    {"id": "rag-d2-03", "subject": "RAG", "number": "D2-03", "title": "Knowledge Graph RAG", "file": "3. Task_2.ipynb"},
    {"id": "rag-d2-04", "subject": "RAG", "number": "D2-04", "title": "MCP RAG", "file": "4_RAG_framework_evaluation_with_MCP.ipynb"},
]

SOURCES = {
    "d1_llama": Path("1일차") / "실습 자료" / "Code" / "1. Llama_index.ipynb",
    "d1_rag": Path("1일차") / "실습 자료" / "Code" / "2. RAG.ipynb",
    "d2_prep": Path("2일차") / "실습 자료" / "Code" / "1. Data_preprocessing.ipynb",
    "d2_task1": Path("2일차") / "실습 자료" / "Code" / "2. Task_1.ipynb",
    "d2_task2": Path("2일차") / "실습 자료" / "Code" / "3. Task_2.ipynb",
    "d2_mcp": Path("2일차") / "실습 자료" / "Code" / "4_RAG_framework_evaluation_with_MCP.ipynb",
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


# Day 1 — LlamaIndex fundamentals
add("rag-d1-01", "d1_llama", 12, "문서 로딩", "data 폴더의 문서를 LlamaIndex Document로 불러오세요.", 'SimpleDirectoryReader("data").load_data()')
add("rag-d1-01", "d1_llama", 15, "인덱스 생성", "문서 목록으로 VectorStoreIndex를 생성하세요.", "VectorStoreIndex.from_documents(documents)")
add("rag-d1-01", "d1_llama", 21, "문장 분할", "노드 분할에 사용할 SentenceSplitter를 생성하세요.", "SentenceSplitter(chunk_size=1024, chunk_overlap=200)")
add("rag-d1-01", "d1_llama", 21, "노드 생성", "문서를 노드 단위로 분할하세요.", "parser.get_nodes_from_documents(documents)")
add("rag-d1-01", "d1_llama", 25, "토큰화", "GPT-3.5 Turbo 모델에 맞는 tiktoken 인코더를 선택하세요.", 'tiktoken.encoding_for_model("gpt-3.5-turbo")')
add("rag-d1-01", "d1_llama", 27, "변환 파이프라인", "짧은 chunk와 overlap을 갖는 SentenceSplitter를 만드세요.", "SentenceSplitter(chunk_size=200, chunk_overlap=50)")
add("rag-d1-01", "d1_llama", 27, "변환 파이프라인", "text_splitter 변환을 적용하여 인덱스를 생성하세요.", "VectorStoreIndex.from_documents(documents=documents, transformations=[text_splitter])")
add("rag-d1-01", "d1_llama", 32, "Query Engine", "인덱스를 질의 엔진으로 변환하세요.", "index.as_query_engine()")
add("rag-d1-01", "d1_llama", 36, "질의 실행", "query_engine으로 질문을 실행하세요.", 'query_engine.query("What is the first programs the author tried writing?")')
add("rag-d1-01", "d1_llama", 49, "Retriever", "인덱스를 retriever로 변환하세요.", "index.as_retriever()")
add("rag-d1-01", "d1_llama", 49, "검색", "retriever에서 관련 passage를 검색하세요.", 'retriever.retrieve("Who is the author?")')
add("rag-d1-01", "d1_llama", 59, "문서 추가", "새 텍스트와 ID를 갖는 Document를 만드세요.", 'Document(text=data_text, id_="new_doc_id")')
add("rag-d1-01", "d1_llama", 59, "문서 추가", "기존 인덱스에 새 문서를 삽입하세요.", "index.insert(docu)")
add("rag-d1-01", "d1_llama", 70, "문서 삭제", "docstore에서도 함께 제거하도록 참조 문서를 삭제하세요.", "index.delete_ref_doc(id, delete_from_docstore=True)")
add("rag-d1-01", "d1_llama", 77, "응답 합성", "compact 모드의 response synthesizer를 만드세요.", 'get_response_synthesizer(response_mode="compact")')

# Day 1 — end-to-end RAG
add("rag-d1-02", "d1_rag", 25, "Wikipedia Reader", "도시 이름으로 Wikipedia 문서를 불러오세요.", "reader.load_data(city_names, auto_suggest=False)")
add("rag-d1-02", "d1_rag", 28, "인덱스 생성", "Wikipedia 문서로 벡터 인덱스를 만드세요.", "VectorStoreIndex.from_documents(documents)")
add("rag-d1-02", "d1_rag", 30, "Query Engine", "인덱스에서 query engine을 생성하세요.", "index.as_query_engine()")
add("rag-d1-02", "d1_rag", 38, "RAG 검색", "직접 만든 RAG 클래스에서 query engine으로 문맥을 검색하세요.", "query_engine.query(query)")
add("rag-d1-02", "d1_rag", 38, "RAG 생성", "검색 문맥을 사용해 채팅 완성 결과의 텍스트를 가져오세요.", ").choices[0].message.content")
add("rag-d1-02", "d1_rag", 38, "RAG 흐름", "검색 결과를 응답 생성 단계에 전달하세요.", "self.generate_response(query, context_str)")
add("rag-d1-02", "d1_rag", 42, "Retriever", "벡터 인덱스를 retriever로 변환하세요.", "index.as_retriever()")
add("rag-d1-02", "d1_rag", 42, "검색", "질문과 관련된 노드를 검색하세요.", "retriever.retrieve(city_question)")
add("rag-d1-02", "d1_rag", 45, "Chunk 설정", "짧은 문맥용 SentenceSplitter 설정을 완성하세요.", "SentenceSplitter(chunk_size=200, chunk_overlap=50)")
add("rag-d1-02", "d1_rag", 45, "Chunk 설정", "긴 문맥용 SentenceSplitter 설정을 완성하세요.", "SentenceSplitter(chunk_size=1024, chunk_overlap=200)")
add("rag-d1-02", "d1_rag", 47, "Top-k 검색", "짧은 chunk 인덱스에서 상위 1개를 검색하도록 retriever를 만드세요.", "index_short.as_retriever(similarity_top_k=1)")
add("rag-d1-02", "d1_rag", 53, "Top-k 검색", "짧은 chunk 인덱스에서 상위 2개를 검색하도록 설정하세요.", "index_short.as_retriever(similarity_top_k=2)")
add("rag-d1-02", "d1_rag", 56, "문맥 결합", "검색된 노드 내용을 두 줄 간격으로 합치세요.", '"\\n\\n".join([n.node.get_content() for n in nodes])')
add("rag-d1-02", "d1_rag", 58, "응답 합성", "compact 모드의 response synthesizer를 생성하세요.", 'get_response_synthesizer(response_mode="compact")')

# Day 2 — data preprocessing
add("rag-d2-01", "d2_prep", 16, "압축 데이터", "bz2 압축 JSONL 파일을 텍스트 모드로 여세요.", "bz2.open(file_path, 'rt')")
add("rag-d2-01", "d2_prep", 16, "JSONL 파싱", "한 줄의 앞뒤 공백을 제거하고 JSON으로 파싱하세요.", "json.loads(line.strip())")
add("rag-d2-01", "d2_prep", 16, "데이터 적재", "파싱된 항목을 dataset에 추가하세요.", "dataset.append(data)")
add("rag-d2-01", "d2_prep", 21, "도메인 추출", "각 도메인의 첫 예시만 저장하세요.", "unique_domains[domain_value] = item")
add("rag-d2-01", "d2_prep", 28, "질문 유형", "각 question_type의 첫 예시만 저장하세요.", "unique_question_types[question_type] = item")
add("rag-d2-01", "d2_prep", 31, "분포 집계", "question_type별 데이터 개수를 세세요.", "Counter([item['question_type'] for item in dataset])")
add("rag-d2-01", "d2_prep", 44, "HTML 파싱", "lxml 파서로 검색 결과 HTML을 파싱하세요.", 'BeautifulSoup(html_text["page_result"], features="lxml")')
add("rag-d2-01", "d2_prep", 44, "텍스트 추출", "HTML에서 공백 구분자를 사용해 텍스트만 추출하세요.", 'soup.get_text(" ", strip=True)')
add("rag-d2-01", "d2_prep", 44, "문장 분할", "텍스트에서 문장 시작·끝 offset을 얻으세요.", "text_to_sentences_and_offsets(text)")
add("rag-d2-01", "d2_prep", 44, "Chunk 제한", "각 문장을 최대 4000자로 잘라 chunk를 만드세요.", "text[start:end][:4000]")

# Day 2 — search retrieval and reader
add("rag-d2-02", "d2_task1", 7, "HTML 파싱", "검색 결과의 HTML 본문을 텍스트로 변환하세요.", 'soup.get_text(" ", strip=True)')
add("rag-d2-02", "d2_task1", 7, "문장 분할", "문서의 문장 offset을 추출하세요.", "text_to_sentences_and_offsets(document)")
add("rag-d2-02", "d2_task1", 12, "Embedding", "OpenAI의 small embedding 모델로 임베딩을 생성하세요.", 'model="text-embedding-3-small"')
add("rag-d2-02", "d2_task1", 12, "Embedding", "응답의 각 item에서 numpy embedding을 추출하세요.", "[np.array(item.embedding) for item in response.data]")
add("rag-d2-02", "d2_task1", 12, "코사인 유사도", "문서와 질문 임베딩의 코사인 유사도를 계산하세요.", "np.dot(all_embeddings, query_embedding) / (")
add("rag-d2-02", "d2_task1", 12, "Top-k", "유사도가 큰 순서대로 topk 인덱스를 선택하세요.", "(-cosine_scores).argsort()[:topk]")
add("rag-d2-02", "d2_task1", 16, "LlamaIndex 설정", "기본 임베딩 모델을 OpenAI small 모델로 지정하세요.", 'OpenAIEmbedding(model="text-embedding-3-small")')
add("rag-d2-02", "d2_task1", 16, "Chunk 설정", "LlamaIndex용 문장 분할기를 생성하세요.", "SentenceSplitter(chunk_size=512, chunk_overlap=0)")
add("rag-d2-02", "d2_task1", 16, "벡터 인덱스", "문서와 parser 변환으로 벡터 인덱스를 만드세요.", "VectorStoreIndex.from_documents(documents = documents, transformations=[self.parser])")
add("rag-d2-02", "d2_task1", 16, "Top-k 검색", "요청된 topk를 similarity_top_k로 전달하세요.", "base_index.as_retriever(similarity_top_k=topk)")
add("rag-d2-02", "d2_task1", 23, "Prompt 구성", "참조 문맥을 모델 입력 최대 길이로 제한하세요.", "references[:MAX_CONTEXT_REFERENCES_LENGTH]")
add("rag-d2-02", "d2_task1", 23, "Prompt 구성", "검색된 chunk를 순회하며 프롬프트의 reference를 구성하세요.", "for chunk_id, chunk in enumerate(top_k_chunks):")
add("rag-d2-02", "d2_task1", 23, "Prompt 구성", "system prompt를 chat completion 입력 메시지에 넣으세요.", '{"role": "system", "content": system_prompt}')
add("rag-d2-02", "d2_task1", 25, "Chat Completion", "검색 문맥으로 ChatGPT 응답을 생성하는 호출을 완성하세요.", "oai_client.chat.completions.create(")
add("rag-d2-02", "d2_task1", 29, "RAG 흐름", "검색된 결과로 Reader의 응답을 생성하세요.", "self.reader.generate_response(query, retrieved_results)")

# Day 2 — knowledge graph RAG
add("rag-d2-03", "d2_task2", 8, "KG API", "JSON 본문과 헤더를 넣어 KG 서버에 POST 요청하세요.", "requests.post(url, json=data, headers=headers)")
add("rag-d2-03", "d2_task2", 13, "질의 생성 Prompt", "질문을 Query 형식의 user message로 만드세요.", 'user_message += f"Query: {query}\\n"')
add("rag-d2-03", "d2_task2", 15, "구조화 질의", "LLM 응답을 JSON 객체로 변환하세요.", "json.loads(completion)")
add("rag-d2-03", "d2_task2", 15, "도메인 판별", "생성된 질의가 finance 도메인인지 확인하세요.", 'domain == "finance"')
add("rag-d2-03", "d2_task2", 19, "키 정규화", "영숫자 이외 문자를 제거하고 소문자로 바꾸세요.", "re.sub(r'[^a-zA-Z0-9]', '', key).lower()")
add("rag-d2-03", "d2_task2", 19, "시간대 처리", "날짜 처리를 위한 미국 동부 시간대를 만드세요.", "pytz.timezone('US/Eastern')")
add("rag-d2-03", "d2_task2", 21, "KG 결과", "회사명으로 ticker를 조회하세요.", 'api.finance_get_ticker_by_name(res[0])["result"]')
add("rag-d2-03", "d2_task2", 21, "KG 결과", "여러 KG 결과를 DOC 구분자로 결합하세요.", '"<DOC>\\n".join([str(res) for res in kg_results])')
add("rag-d2-03", "d2_task2", 25, "KG Query Engine", "금융 질의일 때 금융 KG 결과를 가져오세요.", "self.get_finance_kg_results(generated_query)")
add("rag-d2-03", "d2_task2", 31, "KG RAG", "KG 검색 결과를 Reader에 전달해 답을 생성하세요.", "self.reader.generate_response(query, [kg_results])")
add("rag-d2-03", "d2_task2", 36, "혼합 RAG", "금융 질문이면 KG 결과만 선택하세요.", "combined_results = [kg_results]")
add("rag-d2-03", "d2_task2", 36, "혼합 RAG", "금융 질문이 아니면 검색 결과를 선택하세요.", "combined_results = retrieved_results")

# Day 2 — evaluation and MCP
add("rag-d2-04", "d2_mcp", 17, "평가 응답 파싱", "평가 응답 문자열을 소문자로 만든 뒤 JSON으로 파싱하세요.", "json.loads(response)")
add("rag-d2-04", "d2_mcp", 19, "CRAG 평가", "평가 지침과 문맥을 사용해 평가 모델을 호출하세요.", "generate_answer(user_prompt=context_template, system_prompt=INSTRUCTIONS)")
add("rag-d2-04", "d2_mcp", 22, "검색 결합", "KG 결과 뒤에 웹 검색 결과를 결합하세요.", "combined_results.extend(retrieved_results)")
add("rag-d2-04", "d2_mcp", 25, "CRAG 점수", "정답·부분 정답·환각 패널티로 CRAG 점수를 계산하세요.", "n_correct_exact + 0.5*n_correct - n_hallucinate")
add("rag-d2-04", "d2_mcp", 37, "MCP Import", "LlamaIndex의 MCP 클라이언트와 도구 명세를 불러오세요.", "from llama_index.tools.mcp import BasicMCPClient, McpToolSpec")
add("rag-d2-04", "d2_mcp", 37, "Agent Import", "FunctionAgent와 ToolCall 이벤트 타입을 불러오세요.", "from llama_index.core.agent.workflow import FunctionAgent, ToolCallResult, ToolCall")
add("rag-d2-04", "d2_mcp", 42, "MCP 연결", "외부 SSE 주소로 MCP client를 생성하세요.", "BasicMCPClient(external_mcp_server)")
add("rag-d2-04", "d2_mcp", 42, "MCP 도구", "client로 MCP tool spec을 생성하세요.", "McpToolSpec(client=mcp_client)")
add("rag-d2-04", "d2_mcp", 42, "도구 조회", "MCP 서버의 도구 목록을 비동기로 가져오세요.", "await mcp_tool.to_tool_list_async()")
add("rag-d2-04", "d2_mcp", 43, "리소스 조회", "MCP 서버의 리소스를 비동기로 가져오세요.", "await mcp_tool.fetch_resources()")
add("rag-d2-04", "d2_mcp", 46, "Agent 생성", "가져온 tools와 LLM으로 FunctionAgent를 만드세요.", "self.agent = FunctionAgent(")
add("rag-d2-04", "d2_mcp", 46, "Agent Context", "생성한 agent의 workflow context를 만드세요.", "Context(self.agent)")
add("rag-d2-04", "d2_mcp", 46, "Agent 실행", "질문과 context로 agent 실행 handler를 만드세요.", "self.agent.run(question, ctx=self.agent_context)")
add("rag-d2-04", "d2_mcp", 55, "MCP RAG", "RAG 검색 전에 MCP agent를 초기화하세요.", "await self.mcp_application.init_agent()")
add("rag-d2-04", "d2_mcp", 55, "MCP RAG", "시간 정보가 포함된 질의를 MCP application에 보내세요.", "await self.mcp_application.query(full_query, verbose=False)")


# The certification PDF is intentionally broad. Keep only the code patterns
# that match both its RAG/llama-index/MCP criteria and the previous exam forms
# supplied by the learner. This is a compact memorization set, not a survey of
# every executable line in the notebooks.
FOCUSED_SPECS = {
    ("d1_llama", 15, "VectorStoreIndex.from_documents(documents)"),
    ("d1_llama", 49, "index.as_retriever()"),
    ("d1_llama", 49, 'retriever.retrieve("Who is the author?")'),
    ("d2_task1", 16, "VectorStoreIndex.from_documents(documents = documents, transformations=[self.parser])"),
    ("d2_task1", 16, "base_index.as_retriever(similarity_top_k=topk)"),
    ("d2_task1", 23, "for chunk_id, chunk in enumerate(top_k_chunks):"),
    ("d2_task1", 23, "references[:MAX_CONTEXT_REFERENCES_LENGTH]"),
    ("d2_task1", 23, '{"role": "system", "content": system_prompt}'),
    ("d2_task1", 25, "oai_client.chat.completions.create("),
    ("d2_task2", 25, "self.get_finance_kg_results(generated_query)"),
    ("d2_task2", 31, "self.reader.generate_response(query, [kg_results])"),
    ("d2_task2", 36, "combined_results = [kg_results]"),
    ("d2_task2", 36, "combined_results = retrieved_results"),
    ("d2_mcp", 37, "from llama_index.tools.mcp import BasicMCPClient, McpToolSpec"),
    ("d2_mcp", 42, "BasicMCPClient(external_mcp_server)"),
    ("d2_mcp", 42, "await mcp_tool.to_tool_list_async()"),
    ("d2_mcp", 46, "self.agent = FunctionAgent("),
    ("d2_mcp", 55, "await self.mcp_application.query(full_query, verbose=False)"),
}

SPECS = [
    spec
    for spec in SPECS
    if (str(spec["sourceKey"]), int(spec["cell"]), str(spec["answer"])) in FOCUSED_SPECS
]

if len(SPECS) > 20:
    raise ValueError("Focused RAG bank must stay at 20 questions or fewer.")


def read_cell(source_key: str, cell_index: int) -> tuple[str, str]:
    relative_path = SOURCES[source_key]
    notebook = json.loads((RAG_ROOT / relative_path).read_text(encoding="utf-8"))
    cell = notebook["cells"][cell_index]
    if cell.get("cell_type") != "code":
        raise ValueError(f"Expected code cell: {relative_path} cell {cell_index}")
    return "".join(cell.get("source", [])), relative_path.name


def clean_source(source: str) -> str:
    excluded_fragments = ("OPENAI_API_KEY", "external_kg_server =", "external_mcp_server =", "10.2.0.165")
    lines = [
        line.rstrip()
        for line in source.splitlines()
        if line.strip() != "### YOUR CODE HERE ###"
        and not any(fragment in line for fragment in excluded_fragments)
    ]
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def build() -> None:
    if not OUTPUT.exists():
        raise FileNotFoundError("Run generate_llm_bank.py first so the shared bank exists.")

    bank = json.loads(OUTPUT.read_text(encoding="utf-8"))
    chapters = [chapter for chapter in bank["chapters"] if chapter.get("subject") != "RAG"]
    questions = [question for question in bank["questions"] if question.get("subject") != "RAG"]
    kept_source_ids = {question["sourceId"] for question in questions}
    cells = {source_id: cell for source_id, cell in bank["cells"].items() if source_id in kept_source_ids}
    chapter_lookup = {chapter["id"]: chapter for chapter in CHAPTERS}

    rag_questions = []
    for index, spec in enumerate(SPECS, start=1):
        source, answer_source = read_cell(str(spec["sourceKey"]), int(spec["cell"]))
        source = clean_source(source)
        answer = str(spec["answer"])
        occurrence = int(spec["occurrence"])
        if source.count(answer) <= occurrence:
            raise ValueError(f"Answer not found: {answer_source} cell {spec['cell']} -> {answer}")

        source_id = f"{spec['sourceKey']}-cell-{spec['cell']}"
        cells[source_id] = {"source": source, "cell": spec["cell"], "answerSource": answer_source}
        chapter = chapter_lookup[str(spec["chapterId"])]
        rag_questions.append({
            "id": f"rag-{index:03d}",
            "subject": "RAG",
            "chapterId": spec["chapterId"],
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
        chapter["questionCount"] = sum(question["chapterId"] == chapter["id"] for question in rag_questions)
    active_chapters = [chapter for chapter in CHAPTERS if chapter["questionCount"] > 0]

    OUTPUT.write_text(json.dumps({
        "chapters": chapters + active_chapters,
        "cells": cells,
        "questions": questions + rag_questions,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(rag_questions)} focused RAG questions across {len(active_chapters)} notebooks -> {OUTPUT}")


if __name__ == "__main__":
    build()
