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
const hooks = {...React,useState(initial) {const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];}};
function load(file) {
  const filename=path.resolve(root,file);
  if(cache.has(filename))return cache.get(filename);
  if(filename.endsWith('.json'))return JSON.parse(fs.readFileSync(filename,'utf8'));
  if(filename.endsWith('.css'))return {};
  const compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}});
  assert.equal(compiled.diagnostics.length,0,`Syntax errors in ${filename}: ${compiled.diagnostics.map(d=>d.messageText).join(', ')}`);
  const code=compiled.outputText;
  const exports={};cache.set(filename,exports);
  vm.runInNewContext(code,{exports,console,window:{scrollTo(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:fn=>fn(),require(name){
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
const {cellParts,cellQuestions,prepQuestions,monthlyBanks,topicBanks,monthlyExams,predictedExams,subjects,isCorrect,results}=data;
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
  assert.equal(JSON.stringify(exam.questionIds),JSON.stringify(monthlyBanks[i].questionIds));
  assert.equal(new Set(exam.questionIds.map(id=>prepQuestions[id].subject)).size,5);
}
const predictedIds=predictedExams.flatMap(e=>e.questionIds);
assert.equal(new Set(predictedIds).size,75,'Three rounds must use different questions');
for(const exam of predictedExams) {
  assert.equal(exam.questionIds.length,25);
  for(const subject of subjects)assert.equal(exam.questionIds.filter(id=>prepQuestions[id].subject===subject).length,5);
  const perfect=Object.fromEntries(exam.questionIds.map(id=>[id,prepQuestions[id].answer]));
  assert(results(exam.questionIds,perfect).every(s=>s.correct===5));
  assert(results(exam.questionIds,{}).every(s=>s.correct===0));
}
for(const topic of topicBanks)assert(topic.questionIds.some(id=>predictedIds.includes(id)),`Predicted coverage: ${topic.id}`);
assert(monthlyBanks[1].questionIds.includes('llm-017'));assert(monthlyBanks[1].questionIds.includes('vision-024'));
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
  assert(monthlyBanks[1].questionIds.includes(id));assert(monthlyBanks[2].questionIds.includes(id));
  assert.equal(prepQuestions[id].kind,'원본 실습 빈칸 · 해설 답안');
}
assert(cellQuestions(monthlyBanks[1].questionIds,'llm-014').length>=12);
assert(prepQuestions['llm-089'].fullCode.includes('class MultiHeadAttention'));
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
assert.equal(button(tree,'객관식 정답 확인').props.disabled,true);
all(tree,n=>n.type==='input')[0].props.onChange();tree=render();
button(tree,'객관식 정답 확인').props.onClick();tree=render();assert.equal(feedback(tree).length,1);
button(tree,'보기 접고').props.onClick();tree=render();assert(textarea(tree));assert.equal(feedback(tree).length,0);assert.equal(all(tree,n=>n.type==='input').length,0);
textarea(tree).props.onChange({target:{value:prepQuestions[props.collection.questionIds[0]].answer}});tree=render();button(tree,'주관식 채점').props.onClick();tree=render();assert(text(feedback(tree)[0]).includes('✓ 정답'));
const bankKey=`ai-monthly-prep-v3:bank:${props.collection.id}`;
assert(JSON.parse(storage.get(bankKey)).items[props.collection.questionIds[0]].graded);
slots.length=0;props={...props,initial:JSON.parse(storage.get(bankKey))};tree=render();assert(textarea(tree).props.value);assert.equal(feedback(tree).length,1);
console.log('PASS: required choice-first flow, hidden options in writing, grading and persisted study progress');

slots.length=0;props={collection:predictedExams[0],exam:true,initial:empty(),onHome(){}};tree=render();
assert.equal(all(tree,n=>n.type==='input').length,0);assert.equal(feedback(tree).length,0);
textarea(tree).props.onChange({target:{value:prepQuestions[props.collection.questionIds[0]].answer}});tree=render();button(tree,'다음 →').props.onClick();tree=render();
textarea(tree).props.onChange({target:{value:'wrong'}});tree=render();button(tree,'전체 답안 제출').props.onClick();tree=render();
assert(text(tree).includes('1/25문항 (4점)'));assert(textarea(tree).props.readOnly);assert.equal(feedback(tree).length,1);
const examKey=`ai-monthly-prep-v3:exam:${props.collection.id}`;
slots.length=0;props={...props,initial:JSON.parse(storage.get(examKey))};tree=render();assert(textarea(tree).props.readOnly);assert(text(tree).includes('1/25문항 (4점)'));
button(tree,'오답·미입력만').props.onClick();tree=render();assert.equal(all(tree,n=>n.type==='nav')[0].props.children.length,24);
button(tree,'답안 초기화').props.onClick();tree=render();assert.equal(textarea(tree).props.value,'');assert.equal(feedback(tree).length,0);assert(!textarea(tree).props.readOnly);
console.log('PASS: no answers before submission, unanswered grading, subject scores, locked saved results, wrong-only review and retry reset');

slots.length=0;storage.set(`ai-monthly-prep-v3:bank:${monthlyBanks[0].id}`,'{bad json');cursor=0;tree=Home();
button(tree,'학습 / 이어서').props.onClick();cursor=0;tree=Home();assert.equal(tree.props.initial.index,0);assert.equal(Object.keys(tree.props.initial.items).length,0);
console.log('PASS: corrupt storage safely starts a fresh attempt');
console.log('Monthly counts:',monthlyBanks.map(c=>`${c.title}: ${c.questionIds.length}`).join(', '));
console.log('Unique questions:',Object.keys(prepQuestions).length);
