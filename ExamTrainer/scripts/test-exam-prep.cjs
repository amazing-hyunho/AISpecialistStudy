/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const root = path.resolve(__dirname,'..');
const cache = new Map(), storage = new Map(), slots = [];
let cursor = 0;
const hooks = {...React,useEffect(){},useState(initial) {const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];}};
function load(file) {
  const filename=path.resolve(root,file);
  if(cache.has(filename))return cache.get(filename);
  if(filename.endsWith('.json'))return JSON.parse(fs.readFileSync(filename,'utf8'));
  if(filename.endsWith('.css'))return {};
  const compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}});
  assert.equal(compiled.diagnostics.length,0,`Syntax errors in ${filename}: ${compiled.diagnostics.map(d=>d.messageText).join(', ')}`);
  const code=compiled.outputText;
  const exports={};cache.set(filename,exports);
  vm.runInNewContext(code,{exports,console,window:{scrollTo(){},addEventListener(){},removeEventListener(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:fn=>fn(),require(name){
    if(name==='react')return hooks;
    if(name==='next/link')return 'a';
    if(!name.startsWith('.'))return require(name);
    const base=path.resolve(path.dirname(filename),name);
    const resolved=[base,base+'.ts',base+'.tsx',base+'.json'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
    if(!resolved)throw new Error(name);
    return load(resolved);
  }},{filename});
  return exports;
}
const data=load('app/exam-prep/data.ts');
const {novemberExams}=data;
const {choicePreview,cellParts,cellQuestions,prepQuestions,examQuestions,monthlyBanks,monthlyReferenceBanks,topicBanks,monthlyExams,predictedExams,subjects,isCorrect,results}=data;
const {suppliedInExams,monthlyExamBlueprints}=load('app/exam-prep/exam-design.ts');
assert.equal(monthlyBanks.length,5);assert.equal(monthlyExams.length,5);assert.equal(predictedExams.length,3);assert.equal(topicBanks.length,24);
for(const c of [...monthlyBanks,...topicBanks,...monthlyExams,...predictedExams]) {
  assert(c.questionIds.length>0);assert.equal(new Set(c.questionIds).size,c.questionIds.length);
  for(const id of c.questionIds) {
    const q=prepQuestions[id];assert(q,`${c.id}: ${id}`);
    assert.equal(q.choices.length,4);assert.equal(q.choices.filter(c=>c.correct).length,1);
    assert.equal(new Set(q.choices.map(c=>c.text)).size,4);
    assert(q.context.includes('【빈칸】'));assert(q.source);assert(q.explanation);
    assert(isCorrect(id,'\n  '+q.answer+'\n'));assert(!isCorrect(id,''));assert(!isCorrect(id,'incorrect_answer'));
  }
}
for(const [i,exam] of monthlyExams.entries()) {
  assert.equal(JSON.stringify(exam.questionIds),JSON.stringify(monthlyExamBlueprints[monthlyBanks[i].id].questionIds));
  assert(exam.questionIds.every(id=>monthlyReferenceBanks[i].questionIds.includes(id)),'Keep each mock within its recalled monthly scope');
  assert(exam.questionIds.length<monthlyReferenceBanks[i].questionIds.length,'Remove peripheral/redundant questions');
  assert.equal(JSON.stringify(exam.questionIds),JSON.stringify(monthlyBanks[i].questionIds));
  assert.equal(new Set(exam.questionIds.map(id=>prepQuestions[id].subject)).size,5);
}
const predictedIds=predictedExams.flatMap(e=>e.questionIds);
assert.equal(new Set(predictedIds).size,75,'Three rounds must use different questions');
for(const exam of predictedExams) {
  assert.equal(exam.questionIds.length,25);
  for(const subject of subjects)assert.equal(exam.questionIds.filter(id=>prepQuestions[id].subject===subject).length,5);
  const perfect=Object.fromEntries(exam.questionIds.map(id=>[id,examQuestions[id].answer]));
  assert(results(exam.questionIds,perfect,true).every(s=>s.correct===5));
  assert(results(exam.questionIds,{},true).every(s=>s.correct===0));
}
for(const topic of topicBanks)assert(topic.questionIds.some(id=>predictedIds.includes(id)),`Predicted coverage: ${topic.id}`);
assert(monthlyReferenceBanks[1].questionIds.includes('llm-017'));assert(monthlyBanks[1].questionIds.includes('vision-024'));
assert(Object.values(prepQuestions).every(q=>!q.id.startsWith('extra-')));
for (const id of ['data-learning','vision-learning','distillation']) assert(topicBanks.some(t=>t.id===id));
// Additional questions are exact excerpts, never invented replacement code.
const material = load('app/exam-prep/material-questions.json');
for (const item of material) {
  const notebook = JSON.parse(fs.readFileSync(path.resolve(root,'../Study',item.answerSource),'utf8'));
  const original = notebook.cells[item.cell].source.join('');
  assert(original.includes(item.source), `Excerpt not in source: ${item.question.id}`);
  assert(item.source.includes(item.blank));
  assert(prepQuestions[item.question.id]);
}
const sourceBank=load('app/question-bank.json');
for (const id of Object.keys(prepQuestions)) {
  if (id.startsWith('nov2-')) {
    const record=load('app/exam-prep/november.json').questions.find(q=>q.id===id);
    assert(record?.sourceQuestionId);
    const base=examQuestions[record.sourceQuestionId];
    const originalCode=base?.fullCode ?? load('app/october-recall/content.json').topics.find(t=>t.code.includes(record.answer))?.code;
    assert(originalCode,`Missing November source: ${id}`);
    assert.equal(record.fullCode,originalCode.replace(/^[ \t]*#[^\n]*(?:힌트|TODO|gather|logsigmoid|einsum)[^\n]*\n/gmi,''));
    continue;
  }
  if (id.startsWith('oct-')) {
    const october=load('app/october-recall/content.json');
    const original=october.questions.find(q=>q.id===id);
    assert(original && original.answers.includes(prepQuestions[id].answer));
    assert(october.topics.some(t=>t.code===prepQuestions[id].fullCode));
    continue;
  }
  if (material.some(item=>item.question.id===id)) continue;
  const q=sourceBank.questions.find(q=>q.id===id);
  assert(q);
  assert.notEqual(sourceBank.cells[q.sourceId].sourceKind,'reconstructed');
}
for(const file of ['fixed-exams.ts','mock-exam.tsx','mock-selection.ts'])assert(!fs.existsSync(path.join(root,'app',file)));
for(const collection of [...monthlyBanks,...predictedExams,...topicBanks]) {
  for(const id of collection.questionIds) {
    const parts=cellParts(collection.questionIds,id), q=prepQuestions[id];
    const original=parts.map(p=>p.question ? q.fullCode.slice(p.question.start,p.question.end) : p.text).join('');
    assert.equal(original,q.fullCode,'No original code may be dropped');
    assert.equal(parts.filter(p=>p.question).length,cellQuestions(collection.questionIds,id).length);
  }
}
for(const id of ['llm-014','llm-015','llm-016','llm-083','llm-084','llm-085','llm-086','llm-087','llm-088']) {
  assert(monthlyReferenceBanks[1].questionIds.includes(id));assert(monthlyReferenceBanks[2].questionIds.includes(id));
  assert.equal(prepQuestions[id].kind,'원본 실습 빈칸 · 해설 답안');
}
assert(cellQuestions(monthlyReferenceBanks[1].questionIds,'llm-014').length>=12);
assert(prepQuestions['llm-089'].fullCode.includes('class MultiHeadAttention'));
for(const collection of [...monthlyExams,...predictedExams]) for(const id of collection.questionIds) {
  assert(!suppliedInExams.has(id));
  const q=examQuestions[id];assert(q.hint?.length>15);
  const parts=cellParts(collection.questionIds,id,true);
  assert.equal(parts.map(p=>p.question ? p.question.answer : p.text).join(''),q.fullCode,'All exam blanks must reconstruct supplied cell');
  assert(!q.fullCode.includes('????'),'Every original exercise placeholder is resolved before masking');
  assert(isCorrect(id,q.answer,true));assert(!isCorrect(id,'wrong',true));
}
assert.equal(examQuestions['llm-016'].answer,'F.logsigmoid');
assert.equal(examQuestions['llm-085'].answer,'torch.gather');
assert.equal(examQuestions['ondevice-010'].answer,'torch.sum');
assert(examQuestions['ondevice-010'].context.includes('(T**2)'));
assert.equal(prepQuestions['llm-016'].answer,'-F.logsigmoid(beta * logits)');
for(const id of ['llm-005','llm-094','llm-051','rag-001','rag-024','ondevice-062']) {
  assert(monthlyExams[4].questionIds.includes(id),`Direct September recall must remain: ${id}`);
  assert.equal(examQuestions[id].answer,prepQuestions[id].answer,`Preserve implementation-sized blank: ${id}`);
}
assert(!monthlyExams[4].questionIds.includes('llm-049'),'Omit unmentioned adjacent embedding-layer exercise');
assert(examQuestions['rag-024'].hint.includes('딕셔너리 전체'));
assert(examQuestions['llm-094'].hint.includes('num_heads'));
assert(!isCorrect('llm-016',prepQuestions['llm-016'].answer,true));
console.log('PASS: exam-only core spans, per-blank hints, supplied formulas, resolved DPO cell and separate grading');
console.log('PASS: five monthly banks/exams, 24 topics, 75 distinct balanced prediction questions, four choices, answer/source coverage');

const {Session,default:Home}=load('app/exam-prep/page.tsx');
const empty=()=>({version:3,index:0,items:{},submitted:false});
function all(node,predicate) {if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(n=>all(n,predicate));return [...(predicate(node)?[node]:[]),...all(node.props?.children,predicate)];}
function text(node) {if(node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);if(Array.isArray(node))return node.map(text).join('');return text(node.props?.children);}
const buttons=tree=>all(tree,n=>n.type==='button');
const button=(tree,label)=>{const b=buttons(tree).find(b=>text(b).includes(label));assert(b,`Button ${label}`);return b;};
const textarea=tree=>all(tree,n=>n.type==='textarea' && n.props['aria-current']==='step')[0];
const feedback=tree=>all(tree,n=>n.props?.className==='prep-feedback');
let props={collection:monthlyBanks[0],exam:false,initial:empty(),onHome(){}};
function render(){cursor=0;return Session(props);}
let tree=render();assert.equal(textarea(tree).props.readOnly,true);assert.equal(feedback(tree).length,0);
assert.equal(all(tree,n=>n.type==='textarea').length,cellQuestions(props.collection.questionIds,props.collection.questionIds[0]).length);
assert(text(tree).includes('class MultiHeadAttention'));
assert.equal(button(tree,'주관식 문제로 이동').props.disabled,true);
const preview=all(tree,n=>n.props?.['aria-label']==='객관식 코드 미리보기')[0];
assert(preview);assert(text(preview).includes('【현재 빈칸】'));
assert(text(preview).includes('【빈칸 2】'));
assert(!text(preview).includes(prepQuestions['llm-090'].answer));
const choiceStage=all(tree,n=>n.props?.['aria-label']==='객관식 단계')[0];
assert(choiceStage.props.children.findIndex(n=>n?.props?.['aria-label']==='객관식 코드 미리보기') < choiceStage.props.children.findIndex(n=>n?.type==='fieldset'));
for(const collection of [...monthlyBanks,...topicBanks,...predictedExams]) for(const id of collection.questionIds) {
  const snippet=choicePreview(collection.questionIds,id);
  assert.equal(snippet.split('【현재 빈칸】').length,2);
}

function key(value,extra={}) {return {key:'Enter',ctrlKey:true,metaKey:false,nativeEvent:{isComposing:false},repeat:false,currentTarget:{value},preventDefault(){},stopPropagation(){},...extra};}
// Keyboard 1~4 selects multiple-choice option; Ctrl+Enter moves to subjective writing.
tree.props.onKeyDown(key('',{key:'2',ctrlKey:false}));tree=render();
assert.equal(all(tree,n=>n.type==='input')[1].props.checked,true);
assert.equal(textarea(tree).props.readOnly,true);
assert.equal(button(tree,'주관식 문제로 이동').props.disabled,false);
tree.props.onKeyDown(key(''));tree=render();
assert.equal(textarea(tree).props.readOnly,false);assert.equal(feedback(tree).length,0);assert.equal(all(tree,n=>n.type==='input').length,0);

textarea(tree).props.onKeyDown(key('  '));tree=render();assert.equal(feedback(tree).length,0);
textarea(tree).props.onKeyDown(key('wrong',{nativeEvent:{isComposing:true}}));tree=render();assert.equal(feedback(tree).length,0);
textarea(tree).props.onKeyDown(key('wrong',{repeat:true}));tree=render();assert.equal(feedback(tree).length,0);
textarea(tree).props.onChange({target:{value:'wrong'}});tree=render();
textarea(tree).props.onKeyDown(key('wrong'));tree=render();assert(text(feedback(tree)[0]).includes('× 오답'));
textarea(tree).props.onKeyDown(key('wrong'));tree=render();assert.equal(slots[0].index,0,'Wrong answers must not advance');
textarea(tree).props.onChange({target:{value:prepQuestions[props.collection.questionIds[0]].answer}});tree=render();assert.equal(feedback(tree).length,0);
textarea(tree).props.onKeyDown(key(prepQuestions[props.collection.questionIds[0]].answer,{ctrlKey:false,metaKey:true}));tree=render();assert(text(feedback(tree)[0]).includes('✓ 정답'));
console.log('PASS: masked preview before choices; 1~4 choice keys + Ctrl/Cmd+Enter grading, empty/IME/repeat guards and edit-to-regrade');
const bankKey=`ai-monthly-prep-v5:monthly-bank:${props.collection.id}`;
assert(JSON.parse(storage.get(bankKey)).items[props.collection.questionIds[0]].graded);
slots.length=0;props={...props,initial:JSON.parse(storage.get(bankKey))};tree=render();assert(textarea(tree).props.value);assert.equal(feedback(tree).length,1);
console.log('PASS: required choice-first flow, hidden options in writing, grading and persisted study progress');
// Advancing via Ctrl+Enter from session/button level as well as textarea
tree.props.onKeyDown(key(''));tree=render();
assert.equal(slots[0].index,1);assert.equal(all(tree,n=>n.type==='input').length,4);
assert(slots[0].items[props.collection.questionIds[0]].graded);
const lastIndex=props.collection.questionIds.length-1,lastId=props.collection.questionIds[lastIndex];
slots.length=0;props={...props,initial:{...empty(),index:lastIndex,items:{[lastId]:{writing:true,answer:prepQuestions[lastId].answer}}}};tree=render();
textarea(tree).props.onKeyDown(key(textarea(tree).props.value));tree=render();assert(text(feedback(tree)[0]).includes('✓ 정답'));
textarea(tree).props.onKeyDown(key(textarea(tree).props.value));tree=render();assert.equal(slots[0].index,lastIndex);
assert.equal(button(tree,'마지막 문제까지').props.disabled,true);
console.log('PASS: correct-answer shortcut advances once; last question never wraps');

// A narrowed DPO blank must use matching options, preview, hint and keyboard grading.
for(const collection of monthlyBanks) for(const id of collection.questionIds) {
  const q=examQuestions[id],correct=q.choices.filter(c=>c.correct);
  assert.equal(q.choices.length,4);assert.equal(correct.length,1);assert.equal(correct[0].text,q.answer);
  assert.equal(new Set(q.choices.map(c=>c.text)).size,4);
  for(const c of q.choices)assert.equal(isCorrect(id,c.text,true),c.correct);
}
slots.length=0;const dpoBank=monthlyBanks[1];
props={collection:dpoBank,exam:false,initial:{...empty(),index:dpoBank.questionIds.indexOf('llm-016')},onHome(){}};tree=render();
assert(text(tree).includes(examQuestions['llm-016'].hint));
assert(text(all(tree,n=>n.props?.['aria-label']==='객관식 코드 미리보기')[0]).includes('-【현재 빈칸】(beta * logits)'));
const correctOption=all(tree,n=>n.type==='input').find(n=>n.props.value===undefined && n.props.onChange && text(tree).includes('F.logsigmoid'));
assert(correctOption);
// Pick by rendered label so stable shuffling cannot change which option is correct.
all(tree,n=>n.type==='label').find(n=>text(n).includes('F.logsigmoid')).props.children[0].props.onChange();tree=render();
button(tree,'주관식 문제로 이동').props.onClick();tree=render();
textarea(tree).props.onChange({target:{value:'F.logsigmoid'}});tree=render();
textarea(tree).props.onKeyDown(key('F.logsigmoid'));tree=render();assert(text(feedback(tree)[0]).includes('✓ 정답'));
assert(text(tree).includes('주관식 정답 1/33'));
const beforeAdvance=slots[0].index;textarea(tree).props.onKeyDown(key('F.logsigmoid'));tree=render();assert.equal(slots[0].index,beforeAdvance+1);
console.log('PASS: monthly bank/exam parity, adapted choices, preview, hints and narrowed-answer grading/advance');

slots.length=0;props={collection:predictedExams[0],exam:true,initial:empty(),onHome(){}};tree=render();
assert.equal(all(tree,n=>n.props?.className==='prep-blank-hint').length,0);
assert.equal(textarea(tree).props['aria-describedby'],undefined);
assert.equal(all(tree,n=>n.type==='input').length,0);assert.equal(feedback(tree).length,0);
textarea(tree).props.onKeyDown(key(prepQuestions[props.collection.questionIds[0]].answer));tree=render();assert.equal(feedback(tree).length,0);assert.equal(all(tree,n=>n.type==='h3' && text(n)==='예시 답안').length,0);
textarea(tree).props.onChange({target:{value:prepQuestions[props.collection.questionIds[0]].answer}});tree=render();button(tree,'다음 →').props.onClick();tree=render();
textarea(tree).props.onChange({target:{value:'wrong'}});tree=render();button(tree,'전체 답안 제출').props.onClick();tree=render();
assert(text(tree).includes('1/25문항 (4점)'));assert(textarea(tree).props.readOnly);assert.equal(feedback(tree).length,1);
const examKey=`ai-monthly-prep-v5:exam:${props.collection.id}`;
slots.length=0;props={...props,initial:JSON.parse(storage.get(examKey))};tree=render();assert(textarea(tree).props.readOnly);assert(text(tree).includes('1/25문항 (4점)'));
button(tree,'오답·미입력만').props.onClick();tree=render();assert.equal(all(tree,n=>n.type==='nav')[0].props.children.length,24);
button(tree,'답안 초기화').props.onClick();tree=render();assert.equal(textarea(tree).props.value,'');assert.equal(feedback(tree).length,0);assert(!textarea(tree).props.readOnly);
console.log('PASS: no answers before submission, unanswered grading, subject scores, locked saved results, wrong-only review and retry reset');

slots.length=0;storage.set(`ai-monthly-prep-v5:monthly-bank:${monthlyBanks[0].id}`,'{bad json');cursor=0;tree=Home();
button(tree,'학습 / 이어서').props.onClick();cursor=0;tree=Home();assert.equal(tree.props.initial.index,0);assert.equal(Object.keys(tree.props.initial.items).length,0);
console.log('PASS: corrupt storage safely starts a fresh attempt');
console.log('Monthly counts:',monthlyBanks.map(c=>`${c.title}: ${c.questionIds.length}`).join(', '));
console.log('Curated mock counts:',monthlyExams.map(c=>`${c.title}: ${c.questionIds.length}`).join(', '));
console.log('Unique questions:',Object.keys(prepQuestions).length);

assert.equal(novemberExams.length,2);
assert.equal(new Set(novemberExams.flatMap(e=>e.questionIds)).size,50);
for (const exam of novemberExams) {
  assert.equal(exam.questionIds.length,25);
  for (const subject of subjects) assert.equal(exam.questionIds.filter(id=>examQuestions[id].subject===subject).length,5);
  for (const id of exam.questionIds) {
    const parts=cellParts(exam.questionIds,id,true);
    assert.equal(parts.map(p=>p.question?p.question.answer:p.text).join(''),examQuestions[id].fullCode);
    assert(!/^[\w.]+$/.test(examQuestions[id].answer),`November must not ask only a name: ${id}`);
  }
  slots.length=0;
  props={collection:exam,exam:true,initial:{...empty(),items:Object.fromEntries(exam.questionIds.map(id=>[id,{answer:examQuestions[id].answer}]))},onHome(){}};
  tree=render();assert.equal(feedback(tree).length,0);
  button(tree,'전체 답안 제출').props.onClick();tree=render();
  assert(text(tree).includes('25/25문항 (100점)'));assert(textarea(tree).props.readOnly);
  const saved=JSON.parse(storage.get(`ai-monthly-prep-v5:exam:${exam.id}`));
  assert(saved.submitted);
  slots.length=0;props={...props,initial:saved};tree=render();assert(textarea(tree).props.readOnly);
  button(tree,'답안 초기화').props.onClick();tree=render();assert.equal(textarea(tree).props.value,'');
}
slots.length=0;cursor=0;tree=Home();
assert(all(tree,n=>n.props?.id==='november').length===1);
assert(text(tree).includes('11월 대비 1회'));assert(text(tree).includes('11월 대비 2회'));
console.log('PASS: November cards, 50 balanced blanks, exact cell restoration, grading, saved results and retry');

for (const topic of topicBanks) {
  assert.deepEqual([...topic.questionIds].sort(),[...topic.previousQuestionIds].sort(),'Reordering must keep every question');
  const seenNotebooks=new Set(), seenCells=new Set();
  let previous;
  for (const id of topic.questionIds) {
    const q=prepQuestions[id], split=q.cellKey.lastIndexOf(':');
    const notebook=q.cellKey.slice(0,split), cell=Number(q.cellKey.slice(split+1));
    if (previous?.notebook===notebook) {
      assert(cell>=previous.cell,`${topic.id}: notebook cells must advance`);
      if (cell===previous.cell) assert(q.start>=previous.start,`${topic.id}: blanks must advance down the code`);
    } else {
      assert(!seenNotebooks.has(notebook),`${topic.id}: notebook must not reappear`);
      seenNotebooks.add(notebook);
    }
    if (previous?.cellKey!==q.cellKey) {
      assert(!seenCells.has(q.cellKey),`${topic.id}: a source cell must remain contiguous`);
      seenCells.add(q.cellKey);
    }
    previous={notebook,cell,start:q.start,cellKey:q.cellKey};
  }
}
// Old saves held only an index; new saves hold the current question ID.
const gpt=topicBanks.find(t=>t.id==='gpt');
const legacyId=gpt.previousQuestionIds[0], migratedIndex=gpt.questionIds.indexOf(legacyId);
assert(migratedIndex!==0,'Fixture must exercise an actual order change');
const gptKey='ai-monthly-prep-v3:bank:gpt';
storage.set(gptKey,JSON.stringify({...empty(),items:{[legacyId]:{answer:'saved answer',writing:true,graded:true}},index:0}));
function openGpt() {
  slots.length=0;cursor=0;let home=Home();
  const card=all(home,n=>n.type==='article').find(n=>text(n).includes('GPT 구성·생성'));
  button(card,'학습 / 이어서').props.onClick();cursor=0;home=Home();return home.props;
}
let resumed=openGpt();
assert.equal(resumed.initial.index,migratedIndex);
assert.equal(resumed.initial.items[legacyId].answer,'saved answer');
slots.length=0;props=resumed;tree=render();
textarea(tree).props.onChange({target:{value:'updated answer'}});tree=render();
assert.equal(JSON.parse(storage.get(gptKey)).questionId,legacyId);
resumed=openGpt();assert.equal(resumed.initial.index,migratedIndex);
assert.equal(resumed.initial.items[legacyId].answer,'updated answer');
console.log('PASS: all 24 topics follow notebook/cell/code order; legacy and new saves resume the same question');
console.log('GPT code order:',gpt.questionIds.join(', '));
console.log('DPO code order:',topicBanks.find(t=>t.id==='dpo').questionIds.join(', '));

for (const exam of [...monthlyExams,...predictedExams,...novemberExams]) {
  for (let index=0;index<exam.questionIds.length;index++) {
    slots.length=0;props={collection:exam,exam:true,initial:{...empty(),index},onHome(){}};tree=render();
    assert.equal(all(tree,n=>n.props?.className==='prep-blank-hint').length,0);
    assert.equal(textarea(tree).props['aria-describedby'],undefined);
    assert(text(tree).includes('전체 코드의 흐름에 맞게 빈칸을 완성하세요.'));
  }
}
console.log('PASS: every monthly, predicted and November mock hides learning hints at every question');
assert.equal(examQuestions['data-011'].answer,'self.W2','Existing exams must retain their original scope');
assert.equal(examQuestions['nov2-data-011'].answer,'self.W1(src_feat) + self.W2(src_feat*dst_feat)');
assert(examQuestions['nov2-llm-085'].answer.includes('index=labels.unsqueeze(-1)'));
assert(examQuestions['nov2-vision-005'].answer.includes("'b h i d, b h j d -> b h i j'"));
assert(examQuestions['nov2-llm-089'].answer.includes('queries = queries.view'));
assert(novemberExams.every(e=>e.id.endsWith('-v2')));
console.log('PASS: November operation-sized blanks, arguments/axes, QKV blocks and isolated versioned records');
