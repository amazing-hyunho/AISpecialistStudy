/* eslint-disable @typescript-eslint/no-require-imports -- Local CommonJS content generator. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const repo = path.resolve(root,'..');
const data = JSON.parse(fs.readFileSync(path.join(root,'app/study-plan/plan.json'),'utf8'));
function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? walk(path.join(dir,entry.name)) : [path.join(dir,entry.name)]); }
const files = walk(path.join(repo,'Study')).filter(file=>/\.(ipynb|pdf)$/.test(file)).map(file=>path.relative(repo,file).replaceAll('\\','/')).sort();
const count = (items, extension) => items.filter(file=>file.endsWith(extension)).length;
const inventory = {
  notebooks:count(files,'.ipynb'), pdfs:count(files,'.pdf'),
  subjects:['LLM','RAG','Data','Vision','On-device'].map(subject=> {
    const folder = {'Data':'TIME','On-device':'On-Device'}[subject] ?? subject;
    const items = files.filter(file=>file.startsWith(`Study/${folder}/`));
    return {subject,notebooks:count(items,'.ipynb'),pdfs:count(items,'.pdf')};
  }), files,
};
fs.writeFileSync(path.join(root,'app/study-plan/inventory.json'),JSON.stringify(inventory,null,2)+'\n');
const sheet = '# AI Specialist 10일 커리큘럼\n\n확인일: '+data.reviewed+' · 하루 180분(휴식 별도) · 총 30시간\n\n'+data.scopeNote+'\n\n시작일은 웹 페이지에서 변경할 수 있습니다. 이 문서는 Day 1~10 기준 템플릿입니다. 완료 체크·메모는 웹 페이지의 브라우저에 저장됩니다.\n\n## 운영 원칙\n\n- 코드 기초가 있는 학습자의 복습을 가정합니다. 처음 배우는 주제는 별도 보완 시간이 필요할 수 있습니다.\n- 회상 복습 → 강의/함수 전체 읽기 → 자료를 닫고 구현 → 자가 점검 순서로 진행합니다.\n- 모델 전체 학습·대규모 다운로드·외부 서버 연결은 필수 완료 조건이 아닙니다.\n- 80%는 학습용 목표이며 공식 합격 기준이 아닙니다.\n- 여유 60분 항목은 30시간에 포함되지 않는 선택 과제입니다.\n\n' + data.days.map(d=>`## Day ${d.day}. ${d.title}\n\n${d.goal}\n\n${d.blocks.map(b=>`### ${b.label} · ${b.minutes}분\n\n${b.task}\n`).join('\n')}\n### 강의 코드\n\n${d.sources.map(s=>`- ${s.path}${s.cells.length?' · 셀 '+s.cells.join(', '):''}${s.find.length?' · 검색어: '+s.find.join(', '):''}`).join('\n')}\n\n### 완료 기준\n\n${d.checks.map(c=>`- [ ] ${c}`).join('\n')}\n\n${d.practice.map(p=>`- [${p.label}](https://amazing-hyunho.github.io/AISpecialistStudy${p.href})`).join('\n')}\n\n${d.extra}\n`).join('\n') + '\n## 출제 범위 대응\n\n'+data.coverage.map(c=>`- **${c.subject}** (Day ${c.days.join(', ')}): ${c.scope}. ${c.reason}`).join('\n')+'\n\n셀 번호는 Markdown 셀을 포함해 1부터 센 위치입니다.\n';
const out = path.join(root,'public/study-plan');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'10-day-curriculum.md'),sheet);
console.log(`Generated 10-day plan; inventoried ${inventory.notebooks} notebooks and ${inventory.pdfs} PDFs.`);
