const form = document.getElementById('generatorForm');
const buildButton = document.getElementById('buildButton');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const dossierEl = document.getElementById('dossier');
const feedStatus = document.getElementById('feedStatus');
const modeLabel = document.getElementById('modeLabel');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const loadingTitle = document.getElementById('loadingTitle');
const loadingSub = document.getElementById('loadingSub');

fetch('/api/status').then(r => r.json()).then(s => { modeLabel.textContent = s.mode; }).catch(() => { modeLabel.textContent = 'OFFLINE'; });

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr = value => Array.isArray(value) ? value : [];

function renderDossier(d) {
  const cards = (items, kind) => `<div class="data-grid">${arr(items).map(item => `<article class="data-card"><h4>${esc(item.name)}</h4><p>${esc(item.detail)}</p>${kind === 'clue' ? `<span class="card-status">// ${esc(item.status || 'UNVERIFIED')}</span>` : kind === 'character' ? `<span class="card-status">// ${esc(item.role || 'PERSON OF INTEREST')}</span>` : ''}</article>`).join('')}</div>`;
  dossierEl.innerHTML = `
    <div class="dossier-top"><div><div class="classification">${esc(d.classification || 'RESTRICTED // FICTIONAL')}</div><h2>${esc(d.title || 'UNTITLED DOSSIER')}</h2><p class="logline">${esc(d.logline)}</p></div><div class="stamp">${esc(d.mode || 'FICTIONAL')}</div></div>
    <section class="dossier-section"><h3>01 / INCIDENT SUMMARY</h3><p>${esc(d.incident)}</p></section>
    <section class="dossier-section"><h3>02 / RECOVERED CLUES</h3>${cards(d.clues, 'clue')}</section>
    <section class="dossier-section"><h3>03 / PERSONS OF INTEREST</h3>${cards(d.characters, 'character')}</section>
    <section class="dossier-section"><h3>04 / EVENT TIMELINE</h3><div class="timeline">${arr(d.timeline).map(t => `<div class="timeline-item"><time>${esc(t.time)}</time><p>${esc(t.event)}</p></div>`).join('')}</div></section>
    <section class="dossier-section"><h3>05 / LOCATIONS OF INTEREST</h3>${cards(d.locations, 'location')}</section>
    <section class="dossier-section"><h3>06 / HUMAN STAKES</h3><p>${esc(d.stakes)}</p></section>
    <section class="dossier-section"><h3>07 / VISUAL DIRECTION</h3><p>${esc(d.visualDirection)}</p></section>
    <section class="dossier-section"><h3>08 / UNRESOLVED QUESTIONS</h3><ol class="question-list">${arr(d.openQuestions).map(q => `<li>${esc(q)}</li>`).join('')}</ol></section>
    <section class="dossier-section"><h3>09 / NEXT STORY BEAT</h3><div class="next-beat"><p>${esc(d.nextBeat)}</p></div></section>
    <div class="dossier-actions"><button class="small-button" id="copyButton">COPY DOSSIER</button><button class="small-button" id="downloadButton">DOWNLOAD TXT</button></div>`;
  dossierEl.classList.remove('hidden');
  document.getElementById('copyButton').addEventListener('click', () => copyDossier(d));
  document.getElementById('downloadButton').addEventListener('click', () => downloadDossier(d));
}

function dossierText(d) {
  return `${d.title}\n${d.classification}\n\nLOGLINE\n${d.logline}\n\nINCIDENT\n${d.incident}\n\nCLUES\n${arr(d.clues).map(x => `- ${x.name}: ${x.detail} [${x.status || ''}]`).join('\n')}\n\nCHARACTERS\n${arr(d.characters).map(x => `- ${x.name} (${x.role}): ${x.detail}`).join('\n')}\n\nTIMELINE\n${arr(d.timeline).map(x => `- ${x.time}: ${x.event}`).join('\n')}\n\nLOCATIONS\n${arr(d.locations).map(x => `- ${x.name}: ${x.detail}`).join('\n')}\n\nSTAKES\n${d.stakes}\n\nVISUAL DIRECTION\n${d.visualDirection}\n\nOPEN QUESTIONS\n${arr(d.openQuestions).map(x => `- ${x}`).join('\n')}\n\nNEXT STORY BEAT\n${d.nextBeat}\n`;
}
async function copyDossier(d) {
  try { await navigator.clipboard.writeText(dossierText(d)); document.getElementById('copyButton').textContent = 'COPIED'; }
  catch { alert('Clipboard access was blocked. You can select and copy the dossier text from the page.'); }
}
function downloadDossier(d) {
  const blob = new Blob([dossierText(d)], {type:'text/plain'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `${(d.title || 'blacksite-dossier').toLowerCase().replace(/[^a-z0-9]+/g,'-')}.txt`;
  a.click(); URL.revokeObjectURL(url);
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  buildButton.disabled = true; emptyState.classList.add('hidden'); dossierEl.classList.add('hidden');
  loadingState.classList.remove('hidden'); feedStatus.textContent = 'BUILDING';
  const phases = [
    ['ANALYSING SIGNALS','Cross-referencing the initial anomaly...'],
    ['MAPPING CONNECTIONS','Identifying people, places and inconsistencies...'],
    ['ASSEMBLING EVIDENCE','Constructing the timeline and unresolved questions...'],
    ['FINALISING DOSSIER','Preparing the intelligence feed...']
  ];
  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(progress + Math.floor(Math.random()*9)+4, 92);
    progressBar.style.width = `${progress}%`; progressPercent.textContent = `${String(progress).padStart(2,'0')}%`;
    const phase = phases[Math.min(3, Math.floor(progress / 25))];
    loadingTitle.textContent = phase[0]; loadingSub.textContent = phase[1];
  }, 350);
  const payload = {
    genre: document.getElementById('genre').value,
    setting: document.getElementById('setting').value,
    tone: document.getElementById('tone').value,
    incident: document.getElementById('incident').value,
    extra: document.getElementById('extra').value
  };
  try {
    const response = await fetch('/api/generate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Dossier generation failed.');
    clearInterval(timer); progressBar.style.width = '100%'; progressPercent.textContent = '100%';
    setTimeout(() => { loadingState.classList.add('hidden'); renderDossier(data); feedStatus.textContent = 'DOSSIER READY'; modeLabel.textContent = data.mode || modeLabel.textContent; buildButton.disabled = false; }, 350);
  } catch (error) {
    clearInterval(timer); loadingState.classList.add('hidden'); emptyState.classList.remove('hidden');
    feedStatus.textContent = 'ERROR'; buildButton.disabled = false; alert(error.message);
  }
});
