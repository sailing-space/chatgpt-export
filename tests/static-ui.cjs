const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sandbox = { URL, console };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'lib/marked.umd.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'src/render.js'), 'utf8').replace('globalThis.CGX = {', 'globalThis.CGX = { renderRichText,'), sandbox);
const render = (text, refs = []) => sandbox.CGX.renderRichText(text, refs, sandbox.CGX.createContext());
const sample = '<icon name="arrow-down" color="tertiary" size="lg"/>\n<grid columns={2} gap={2}><grid-item><icon name="camera" color="info"/>\n**Visual Snapshot**\n\n스크린샷 보존</grid-item><grid-item><box padding={3}><row align="center" gap={2}><icon name="archive"/>보관</row></box></grid-item></grid>';
const result = render(sample);
assert.match(result.html, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(result.html, /padding:12px/);
assert.match(result.html, /display:flex/);
assert.match(result.html, /<svg role="img"/);
assert.match(result.html, /<strong>Visual Snapshot<\/strong>/);
assert.doesNotMatch(result.html, /CGXUI|&lt;(?:grid|icon|row|box)/);
assert.doesNotMatch(result.md, /<(?:grid|icon|row|box)/);
assert.match(result.md, /스크린샷 보존/);
const loop = render('<grid columns={3}>{#each [{icon:"layout-template",name:"웹 뷰어"},{icon:"notebook-pen",name:"Notion"},{icon:"file-down",name:"PDF / HTML"}] as x}<grid-item><icon name={x.icon}/>{x.name}</grid-item>{/each}</grid>');
assert.match(loop.html, /웹 뷰어/);
assert.match(loop.html, /Notion/);
assert.match(loop.html, /PDF \/ HTML/);
assert.equal((loop.html.match(/class="cgx-ui-grid-item"/g) || []).length, 3);
assert.doesNotMatch(loop.html, /#each|\{x\.|CGXUI/);
const code = '```html\n<row><box padding={3}>literal</box></row>\n```\n\n`<icon name="camera"/>`';
assert.equal(render(code).md, code);
assert.match(render(code).html, /&lt;row&gt;/);
assert.doesNotMatch(render(code).html, /class="cgx-ui/);
const unsafe = render('<grid columns={999} onclick="alert(1)"><grid-item><script>alert(1)</script><icon name="camera" onload="alert(2)"/></grid-item></grid>');
assert.match(unsafe.html, /repeat\(6,/);
assert.doesNotMatch(unsafe.html, /<script|onclick=|onload=/);
assert.match(unsafe.html, /&lt;script&gt;/);
const ordinary = render('# 제목\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n[링크](https://example.com)');
assert.match(ordinary.html, /<table>/);
assert.match(ordinary.html, /href="https:\/\/example.com"/);
const nested = render('<grid><grid-item><grid><grid-item>안쪽</grid-item></grid></grid-item></grid>');
assert.equal((nested.html.match(/class="cgx-ui-grid"/g) || []).length, 2);
const cited = render('<grid><grid-item>출처 \uE200cite\uE202turn1search0\uE201</grid-item></grid>', [{matched_text:'\uE200cite\uE202turn1search0\uE201',type:'webpage',items:[{url:'https://example.com',title:'Example'}]}]);
assert.match(cited.html, /href="https:\/\/example.com\/?"/);
console.log('Static UI regression checks passed.');
// Serialized UI uses nested data, state initializers, arithmetic and handlers.
// These are interpreted as static data; response-provided JavaScript never runs.
const rich = render(`
{@body const phases = [{title:"Build",tasks:["Capture","Export"]},{title:"Check",tasks:["Review"]}]}
{@body const [done,setDone] = DIL.useState([])}
<box border radius="xl" padding={3}>
<text>{done.length}/3 complete</text>
{#each phases as p,i}<box><badge>{p.title}</badge>
{#each p.tasks as task,j}<checkbox checked={done.includes(\`\${i}-\${j}\`)} onChange={v=>setDone(old=>[...old,task])}>{task}</checkbox>{/each}
{#if i<phases.length-1}<divider/>{/if}</box>{/each}
<button onClick={()=>GenUI.copy("a > b")}>Copy</button></box>`);
assert.equal((rich.html.match(/type="checkbox"/g)||[]).length,3);
assert.match(rich.html,/0\/3 complete/);
assert.match(rich.md,/- \[ \] Capture/);
assert.doesNotMatch(rich.html,/#each|#if|@body|setDone|GenUI|onChange|onClick/);
const vector = render(`<svg viewBox="0 0 100 100">{#each [{x:10,fields:["id","name"]}] as b}<rect x={b.x+2} width="20" height="30" fillOpacity=".2"/>{#each b.fields as f,j}<text x={b.x} y={20+j*12} fontWeight="600">{f}</text>{/each}{/each}</svg>`);
assert.match(vector.html, /x="12"/);
assert.match(vector.html, /y="32"/);
assert.match(vector.html, /fill-opacity=".2"/);
assert.match(vector.html, /font-weight="600"/);
assert.doesNotMatch(vector.html,/#each|\{b\.|\{f\}|cgx-ui-text/);
const initial = render('{@body const [view,setView] = DIL.useState("visual")}<segmented-control value={view} options={[{label:"Original",value:"visual"},{label:"Edit",value:"edit"}]}/>{#if view === "visual"}<box height="8px" width="65%" background="surface-tertiary"/>{:else}Hidden branch{/if}');
assert.match(initial.html,/height:8px/);
assert.match(initial.html,/width:65%/);
assert.doesNotMatch(initial.html,/Hidden branch|#if|@body|segmented-control/);
const chart = render('<Chart content={{chartType:"bar",xKey:"name",series:[{dataKey:"score",label:"Score"}],yAxisMax:100,data:[{name:"A",score:75},{name:"B",score:90}]}}/>');
assert.match(chart.html,/aria-label="Bar chart"/);
assert.match(chart.html,/<title>B: Score 90<\/title>/);
assert.match(chart.md,/\| B \| 90 \|/);
const hostile = render('<box onClick={()=>globalThis.pwned=true}>{globalThis.pwned=true}{process.exit()}<svg><script>alert(1)</script><rect fill="url(https://bad.test)" onload="alert(2)"/></svg></box>');
assert.equal(sandbox.pwned,undefined);
assert.doesNotMatch(hostile.html,/<script|onClick=|onload=|fill="url/);
const codeComponent = render('<CodeBlock language="typescript" editable>const x: Record<string, unknown> = {};</CodeBlock>');
assert.match(codeComponent.html, /language-typescript/);
assert.match(codeComponent.html, /Record&lt;string, unknown&gt;/);
const literalComponent = '```html\n<CodeBlock language="typescript">literal</CodeBlock>\n```';
assert.equal(render(literalComponent).md,literalComponent);
console.log('Serialized UI data, charts, SVG and security checks passed.');
