const form=document.getElementById('generatorForm');
const button=document.getElementById('buildButton');
const log=document.getElementById('buildLog');
const canvas=document.getElementById('previewCanvas');
const feed=document.getElementById('feedStatus');
const previewState=document.getElementById('previewState');
const systemState=document.getElementById('systemState');
const track=document.getElementById('buildTrack');
const percent=document.getElementById('buildPercent');
const buildMessage=document.getElementById('buildMessage');
const modeLabel=document.getElementById('modeLabel');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=v=>Array.isArray(v)?v:[];
let paused=false;
let pauseWaiters=[];
function waitIfPaused(){if(!paused)return Promise.resolve();return new Promise(resolve=>pauseWaiters.push(resolve));}
function setProgress(n,msg){track.style.width=n+'%';percent.textContent=String(n).padStart(2,'0')+'%';buildMessage.textContent=msg;}
function addLog(message,type){const line=document.createElement('div');line.className='logline';const time=new Date().toLocaleTimeString('en-GB');line.innerHTML='<span class="log-time">['+time+']</span> '+esc(message);if(type==='ok')line.classList.add('log-ok');if(type==='key')line.classList.add('log-key');log.appendChild(line);log.scrollTop=log.scrollHeight;}
fetch('/api/status').then(r=>r.json()).then(s=>{modeLabel.textContent=s.mode;}).catch(()=>{modeLabel.textContent='OFFLINE';});
function cardGrid(items,kind){return '<div class="built-grid">'+list(items).map(x=>'<article class="built-card"><small>// '+esc(x.status||x.role||kind.toUpperCase())+'</small><h4>'+esc(x.name)+'</h4><p>'+esc(x.detail)+'</p></article>').join('')+'</div>';}
function buildSections(d){
return [
{log:'Creating classified dossier header...',label:'DOSSIER HEADER',html:'<div class="built-hero"><div class="built-classification">'+esc(d.classification||'RESTRICTED // FICTIONAL')+'</div><div class="built-kicker">BLACKSITE INTELLIGENCE // CASE FILE</div><h2>'+esc(d.title||'UNTITLED DOSSIER')+'</h2><p>'+esc(d.logline)+'</p><span class="built-stamp">'+esc(d.mode||'FICTIONAL')+'</span></div>'},
{log:'Writing the incident report...',label:'INCIDENT SUMMARY',html:'<section class="built-section"><h3>01 / INCIDENT SUMMARY</h3><p>'+esc(d.incident)+'</p></section>'},
{log:'Indexing recovered evidence and clues...',label:'RECOVERED CLUES',html:'<section class="built-section"><h3>02 / RECOVERED CLUES</h3>'+cardGrid(d.clues,'clue')+'</section>'},
{log:'Connecting persons of interest...',label:'PERSONS OF INTEREST',html:'<section class="built-section"><h3>03 / PERSONS OF INTEREST</h3>'+cardGrid(d.characters,'person of interest')+'</section>'},
{log:'Building the event timeline...',label:'EVENT TIMELINE',html:'<section class="built-section"><h3>04 / EVENT TIMELINE</h3><div class="built-timeline">'+list(d.timeline).map(x=>'<div><time>'+esc(x.time)+'</time><p>'+esc(x.event)+'</p></div>').join('')+'</div></section>'},
{log:'Mapping locations connected to the incident...',label:'LOCATIONS OF INTEREST',html:'<section class="built-section"><h3>05 / LOCATIONS OF INTEREST</h3>'+cardGrid(d.locations,'location')+'</section>'},
{log:'Calculating the human stakes...',label:'HUMAN STAKES',html:'<section class="built-section"><h3>06 / HUMAN STAKES</h3><p>'+esc(d.stakes)+'</p></section>'},
{log:'Applying the visual direction...',label:'VISUAL DIRECTION',html:'<section class="built-section"><h3>07 / VISUAL DIRECTION</h3><p>'+esc(d.visualDirection)+'</p></section>'},
{log:'Cross-checking unresolved questions...',label:'UNRESOLVED QUESTIONS',html:'<section class="built-section"><h3>08 / UNRESOLVED QUESTIONS</h3><ol class="built-questions">'+list(d.openQuestions).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></section>'},
{log:'Finalising the next story beat...',label:'NEXT STORY BEAT',html:'<section class="built-section"><h3>09 / NEXT STORY BEAT</h3><div class="built-next">'+esc(d.nextBeat)+'</div></section>'}
];}
async function construct(d){
canvas.innerHTML='<div class="live-file"><div class="live-file-top"><span>LIVE FILE ASSEMBLY</span><span id="fileCounter">00 / 10 MODULES</span></div><div id="fileContent"></div><div id="fileActions" class="file-actions"></div></div>';
const content=document.getElementById('fileContent');
const sections=buildSections(d);
for(let i=0;i<sections.length;i++){
await waitIfPaused();
const s=sections[i];
addLog(s.log,'key');
const wrapper=document.createElement('div');
wrapper.className='construct-piece';
wrapper.innerHTML=s.html;
content.appendChild(wrapper);
await sleep(620);
const p=Math.round(((i+1)/sections.length)*100);
setProgress(p,'ASSEMBLING: '+s.label);
document.getElementById('fileCounter').textContent=String(i+1).padStart(2,'0')+' / 10 MODULES';
}
addLog('Running final integrity checks...','key');
await sleep(500);
document.getElementById('fileActions').innerHTML='<button class="small-button" id="copyButton">COPY DOSSIER</button><button class="small-button" id="downloadButton">DOWNLOAD TXT</button>';
document.getElementById('copyButton').addEventListener('click',()=>copyDossier(d));
document.getElementById('downloadButton').addEventListener('click',()=>downloadDossier(d));
addLog('Build complete. Intelligence file is live.','ok');
feed.textContent='BUILD COMPLETE';previewState.textContent='LIVE';systemState.textContent='FILE COMPLETE';
setProgress(100,'ALL MODULES ASSEMBLED');
}
function dossierText(d){return [d.title,d.classification,'LOGLINE',d.logline,'INCIDENT',d.incident,'CLUES',...list(d.clues).map(x=>'- '+x.name+': '+x.detail),'PERSONS OF INTEREST',...list(d.characters).map(x=>'- '+x.name+' ('+x.role+'): '+x.detail),'TIMELINE',...list(d.timeline).map(x=>'- '+x.time+': '+x.event),'LOCATIONS',...list(d.locations).map(x=>'- '+x.name+': '+x.detail),'STAKES',d.stakes,'VISUAL DIRECTION',d.visualDirection,'OPEN QUESTIONS',...list(d.openQuestions).map(x=>'- '+x),'NEXT STORY BEAT',d.nextBeat].join('\n');}
async function copyDossier(d){try{await navigator.clipboard.writeText(dossierText(d));document.getElementById('copyButton').textContent='COPIED';}catch(e){alert('Clipboard access was blocked.');}}
function downloadDossier(d){const blob=new Blob([dossierText(d)],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(d.title||'blacksite-dossier').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.txt';a.click();URL.revokeObjectURL(url);}
form.addEventListener('submit',async event=>{
event.preventDefault();button.disabled=true;paused=false;log.innerHTML='';addLog('Booting BLACKSITE autonomous build engine...');feed.textContent='BUILDING';previewState.textContent='INITIALISING';systemState.textContent='CONSTRUCTING';setProgress(0,'INITIALISING BUILD ENGINE');canvas.innerHTML='<div class="preview-placeholder active-build"><div class="radar"><span></span><span></span><span></span><b>◈</b></div><h3>INITIALISING LIVE PREVIEW</h3><p>The dossier canvas is ready. Waiting for the first module...</p><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>';
const steps=['Reading mission parameters...','Preparing the story architecture...','Generating original intelligence records...','Preparing the live preview canvas...'];
let step=0;const timer=setInterval(()=>{if(step<steps.length){addLog(steps[step++],'key');setProgress(Math.min(12+step*7,40),'GENERATING STORY ARCHITECTURE');}},900);
try{
const payload={genre:document.getElementById('genre').value,setting:document.getElementById('setting').value,tone:document.getElementById('tone').value,incident:document.getElementById('incident').value,extra:document.getElementById('extra').value};
const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
const data=await response.json();if(!response.ok)throw new Error(data.error||'Dossier generation failed.');
clearInterval(timer);addLog('Story data received. Beginning visible construction...','ok');previewState.textContent='ASSEMBLING';await construct(data);
}catch(error){clearInterval(timer);addLog('Build failed: '+error.message);feed.textContent='ERROR';previewState.textContent='ERROR';systemState.textContent='BUILD FAILED';setProgress(0,'BUILD FAILED');alert(error.message);}
finally{button.disabled=false;}
});
