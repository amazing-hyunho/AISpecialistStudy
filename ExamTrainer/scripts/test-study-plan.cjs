/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS TypeScript test harness. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname,'..');
const repo = path.resolve(root,'..');
const plan = JSON.parse(fs.readFileSync(path.join(root,'app/study-plan/plan.json'),'utf8'));
const source = fs.readFileSync(path.join(root,'app/study-plan/schedule.ts'),'utf8');
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod = {exports:{}};
new Function('require','module','exports',compiled)(()=>({default:plan}),mod,mod.exports);
const {validDate,dayDate,parseProgress} = mod.exports;
assert.equal(plan.days.length,10);
assert.deepEqual(plan.days.map(d=>d.day),[1,2,3,4,5,6,7,8,9,10]);
assert.equal(plan.days.flatMap(d=>d.blocks).reduce((s,b)=>s+b.minutes,0),1800);
for(const day of plan.days) {
  assert.equal(day.blocks.reduce((s,b)=>s+b.minutes,0),180,`Day ${day.day} budget`);
  assert.equal(day.checks.length,3);
  for(const source of day.sources) {
    const file = path.join(repo,source.path);
    assert(fs.existsSync(file),source.path);
    if(!file.endsWith('.ipynb')) continue;
    const notebook = JSON.parse(fs.readFileSync(file,'utf8'));
    const cells = notebook.cells.map(c=>Array.isArray(c.source)?c.source.join(''):c.source);
    for(const index of source.cells) assert(cells[index-1]!==undefined,`${source.path} cell ${index}`);
    for(const term of source.find) assert((source.cells.length ? source.cells.map(i=>cells[i-1]) : cells).some(s=>s.includes(term)),`${source.path}: ${term}`);
  }
  for(const link of day.practice) {
    const route=link.href.split('#')[0];
    assert(fs.existsSync(path.join(root,'app',route,'page.tsx')),link.href);
    if(link.href.includes('#')) {
      const anchor=link.href.split('#')[1];
      if(route==='/october-recall/') {
        const content=JSON.parse(fs.readFileSync(path.join(root,'app/october-recall/content.json'),'utf8'));
        assert(content.topics.some(t=>`oct-${t.subject}`===anchor),link.href);
      } else assert(fs.readFileSync(path.join(root,'app',route,'page.tsx'),'utf8').includes(anchor),link.href);
    }
  }
}
assert.equal(plan.coverage.length,5);
for(const c of plan.coverage)for(const day of c.days)assert(plan.days[day-1].subjects.includes(c.subject),`${c.subject} Day ${day}`);
assert(validDate('2028-02-29')); assert(!validDate('2026-02-29')); assert(!validDate('2026-11-31')); assert(!validDate('nonsense'));
assert.equal(dayDate('2026-11-03',9),'2026-11-12');
assert.equal(dayDate('2026-12-28',9),'2027-01-06');
assert.equal(dayDate('2028-02-28',1),'2028-02-29');
assert.equal(dayDate('bad',0),plan.defaultStart);
assert.equal(parseProgress('bad').start,plan.defaultStart);
assert.equal(parseProgress('null').start,plan.defaultStart);
const saved=parseProgress(JSON.stringify({start:'2027-01-01',checked:{'1-0':true,'1-1':'true','99-0':true},notes:{'1':'오답 복습'}}));
assert.equal(saved.start,'2027-01-01');assert(saved.checked['1-0']);assert.equal(saved.checked['1-1'],false);assert.equal(saved.checked['99-0'],undefined);assert.equal(saved.notes['1'],'오답 복습');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'app/study-plan/inventory.json'),'utf8'));
assert.equal(inventory.files.filter(f=>f.endsWith('.ipynb')).length,inventory.notebooks);
assert.equal(inventory.files.filter(f=>f.endsWith('.pdf')).length,inventory.pdfs);
assert(fs.statSync(path.join(root,'public/study-plan/10-day-curriculum.md')).size>5000);
console.log('PASS: 10 days, 30 hours, all scope areas, source cells/functions, practice routes, date arithmetic and progress validation.');
