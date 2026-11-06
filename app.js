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
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function dossierMarkup(d) {
  const cards = (items, kind) => arr(items).map(item => `<article class="data-card build-piece"><h4>${esc(item.name)}</h4><p>${esc(item.detail)}</p>${kind === 'clue' ? `<span class="card-status">// ${esc(item.status || 'UNVERIFIED')}</span>` : kind === 'character' ? `<span class="card-status">// ${esc(item.role || 'PERSON OF INTEREST')}</span>` : ''}</article>`).join('');
  return `
    <div class="build-console"><div class="console-left"><span class="console-pulse"></span> CONSTRUCTION SEQUENCE <b id="buildPercent">00%</b></div><div class="console-track"><i id="buildTrack"></i></div><div class="console-log" id="buildLog">INITIALISING STORY ARCHITECTURE...</div></div>
    <div class="dossier-top build-piece"><div><div class="classification">${esc(d.classification || 'RESTRICTED // FICTIONAL')}</div><h2>${esc(d.title || 'UNTITLED DOSSIER')}</h2><p class="logline">${esc(d.logline)}</p></div><div class="stamp">${esc(d.mode || 'FICTIONAL')}</div></div>
    <section class="dossier-section build-piece"><h3>01 / INCIDENT SUMMARY</h3><p>${esc(d.incident)}</p></section>
    <section class="dossier-section build-piece"><h3>02 / RECOVERED CLUES</h3><div class="data-grid">${cards(d.clues, 'clue')}</div></section>
    <section class="dossier-section build-piece"><h3>03 / PERSONS OF INTEREST</h3><div class="data-grid">${cards(d.characters, 'character')}</div></section>
    <section class="dossier-section build-piece"><h3>04 / EVENT TIMELINE</h3><div class="timeline">${arr(d.timeline).map(t => `<div class="timeline-item build-piece"><time>${esc(t.time)}</time><p>${esc(t.event)}</p></div>`).join('')}</div></section>
    <section class="dossier-section build-piece"><h3>05 / LOCATIONS OF INTEREST</h3><div class="data-grid">${cards(d.locations, 'location')}</div></section>
    <section class="dossier-section build-piece"><h3>06 / HUMAN STAKES</h3><p>${esc(d.stakes)}</p></section>
    <section class="dossier-section build-piece"><h3>07 / VISUAL DIRECTION</h3><p>${esc(d.visualDirection)}</p></section>
    <section class="dossier-section build-piece"><h3>08 / UNRESOLVED QUESTIONS</h3><ol class="question-list">${arr(d.openQuestions).map(q => `<li>${esc(q)}</li>`).join('')}</ol></section>
    <section class="dossier-section build-piece"><h3>09 / NEXT STORY BEAT</h3><div class="next-beat"><p>${esc(d.nextBeat)}</p></div></section>
    <div class="dossier-actions build-piece"><button class="small-button" id="copyButton">COPY DOSSIER</button><button class="small-button" id="downloadButton">DOWNLOAD TXT</button></div>`;
}

function dossierText(d) {
  return `${d.title}\\n${d.classification}\\n\\nLOGLINE\\n${d.logline}\\n\\nINCIDENT\\n${d.incident}\\n\\nCLUES\\n${arr(d.clues).map(x => `- ${x.name}: ${x.detail} [${x.status || ''}]`).join('\\n')}\\n\\nCHARACTERS\\n${arr(d.characters).map(x => `- ${x.name} (${x.role}): ${x.detail}`).join('\\n')}\\n\\nTIMELINE\\n${arr(d.timeline).map(x => `- ${x.time}: ${x.event}`).join('\\n')}\\n\\nLOCATIONS\\n${arr(d.locations).map(x => `- ${x.name}: ${x.detail}`).join('\\n')}\\n\\nSTAKES\\n${d.stakes}\\n\\nVISUAL DIRECTION\\n${d.visualDirection}\\n\\nOPEN QUESTIONS\\n${arr(d.openQuestions).map(x => `- ${x}`).join('\\n')}\\n\\nNEXT STORY BEAT\\n${d.nextBeat}\\n`;
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

async function constructDossier(d) {
  dossierEl.innerHTML = dossierMarkup(d);
  dossierEl.classList.remove('hidden');
  const pieces = [...dossierEl.querySelectorAll('.build-piece')];
  pieces.forEach(piece => piece.classList.add('piece-hidden'));
  const log = document.getElementById('buildLog');
  const track = document.getElementById('buildTrack');
  const percent = document.getElementById('buildPercent');
  const messages = [
    'LAYING DOWN THE CLASSIFIED FILE FRAME...',
    'INSERTING INCIDENT RECORD...',
    'CROSS-LINKING CLUES AND WITNESS PROFILES...',
    'ASSEMBLING THE EVENT TIMELINE...',
    'MAPPING LOCATIONS AND HUMAN STAKES...',
    'SEALING UNRESOLVED QUESTIONS...',
    'DOSSIER STRUCTURE COMPLETE.'
  ];
  const reveal = async (piece, index, total) => {
    piece.classList.remove('piece-hidden');
    piece.classList.add('piece-built');
    const pct = Math.round(((index + 1) / total) * 100);
    track.style.width = pct + '%';
    percent.textContent = String(pct).padStart(2, '0') + '%';
    log.textContent = messages[Math.min(messages.length - 1, Math.floor((index / total) * messages.length))];
    await wait(230);
  };
  for (let i = 0; i < pieces.length; i++) await reveal(pieces[i], i, pieces.length);
  dossierEl.querySelectorAll('.data-card').forEach((card, i) => {
    card.style.animationDelay = (i * 75) + 'ms';
    card.classList.add('piece-built');
  });
  document.getElementById('copyButton').addEventListener('click', () => copyDossier(d));
  document.getElementById('downloadButton').addEventListener('click', () => downloadDossier(d));
  log.textContent = 'ALL MODULES ASSEMBLED // FILE READY.';
  feedStatus.textContent = 'DOSSIER BUILT';
  modeLabel.textContent = d.mode || modeLabel.textContent;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  buildButton.disabled = true;
  emptyState.classList.add('hidden');
  dossierEl.classList.add('hidden');
  loadingState.classList.remove('hidden');
  feedStatus.textContent = 'GENERATING';
  progressBar.style.width = '0%';
  progressPercent.textContent = '00%';
  const payload = {
    genre: document.getElementById('genre').value,
    setting: document.getElementById('setting').value,
    tone: document.getElementById('tone').value,
    incident: document.getElementById('incident').value,
    extra: document.getElementById('extra').value
  };
  const phases = [
    ['READING THE INITIAL SIGNAL','Interpreting your story parameters...'],
    ['FORMING THE STORY WORLD','Generating original evidence and characters...'],
    ['PREPARING THE BUILD','The dossier is ready to assemble on screen...']
  ];
  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(progress + Math.floor(Math.random() * 5) + 2, 88);
    progressBar.style.width = progress + '%';
    progressPercent.textContent = String(progress).padStart(2, '0') + '%';
    const phase = phases[Math.min(2, Math.floor(progress / 30))];
    loadingTitle.textContent = phase[0];
    loadingSub.textContent = phase[1];
  }, 400);
  try {
    const response = await fetch('/api/generate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Dossier generation failed.');
    clearInterval(timer);
    progressBar.style.width = '100%';
    progressPercent.textContent = '100%';
    loadingState.classList.add('hidden');
    dossierEl.classList.remove('hidden');
    await constructDossier(data);
  } catch (error) {
    clearInterval(timer);
    loadingState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    feedStatus.textContent = 'ERROR';
    alert(error.message);
  } finally {
    buildButton.disabled = false;
  }
});
