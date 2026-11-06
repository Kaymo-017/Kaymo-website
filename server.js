require('dotenv').config();
const express = require('express');
const path = require('path');
const OpenAI = require('openai');

const app = express();
app.use(express.json({ limit: '30kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const demoDossiers = [
  {
    title: 'THE SILENT FREQUENCY',
    classification: 'RESTRICTED // FICTIONAL',
    logline: 'A remote listening station receives a distress call timestamped three days in the future.',
    incident: 'At 02:17, Station K-19 recorded a transmission using the call sign of an operative officially listed as missing. The voice gives a location that does not appear on current maps.',
    clues: [
      { name: 'The impossible timestamp', detail: 'The recording metadata predates the station equipment reboot by 72 hours.', status: 'UNVERIFIED' },
      { name: 'The torn photograph', detail: 'A figure stands behind the station chief in a photograph taken before the facility was built.', status: 'UNDER REVIEW' },
      { name: 'The second signal', detail: 'A faint repeating tone appears beneath the distress call, matching an archived test signal.', status: 'UNVERIFIED' }
    ],
    characters: [
      { name: 'Mara Voss', role: 'Signals analyst', detail: 'Notices a pattern in the transmission that others dismiss as interference.' },
      { name: 'Elias Rook', role: 'Former field liaison', detail: 'Was the last person to interview the missing operative.' },
      { name: 'Dr. Sefu Ndlovu', role: 'Archive director', detail: 'Controls access to a sealed collection of pre-digital recordings.' }
    ],
    timeline: [
      { time: '21:40', event: 'Routine maintenance begins at Station K-19.' },
      { time: '00:06', event: 'An unlisted carrier tone appears on the monitoring log.' },
      { time: '02:17', event: 'The distress call is recorded.' },
      { time: '02:31', event: 'The original audio file disappears from the archive.' }
    ],
    locations: [
      { name: 'Station K-19', detail: 'A weather-beaten listening post on a high, isolated plateau.' },
      { name: 'The Meridian Archive', detail: 'A sealed records facility beneath an abandoned communications building.' },
      { name: 'Greywater Motel', detail: 'A roadside stop where the missing operative checked in under another name.' }
    ],
    stakes: 'If the transmission is genuine, someone has access to information that should not exist yet. If it is fabricated, someone inside the station wants the team looking in the wrong direction.',
    visualDirection: 'Cold fluorescent light, analogue monitors, rain on glass, grainy surveillance stills and restrained amber warning lights.',
    nextBeat: 'Mara isolates a phrase hidden beneath the carrier tone. It is not a location. It is her own employee number.',
    openQuestions: ['Who used the missing operative’s call sign?', 'Why was the original audio erased?', 'What is stored in the sealed Meridian Archive?']
  },
  {
    title: 'PROJECT ASHEN GLASS', classification: 'RESTRICTED // FICTIONAL',
    logline: 'An abandoned research compound appears in satellite photographs taken years before its construction.',
    incident: 'A routine image review flags a building at the edge of a restricted valley. The structure is visible in photographs from four different years, although construction records place its opening only six months ago.',
    clues: [
      { name: 'The duplicate structure', detail: 'Four images show identical damage on a roof that was supposedly built later.', status: 'CONFIRMED' },
      { name: 'The blank register', detail: 'The compound visitor book has every page intact except the page for its opening day.', status: 'UNDER REVIEW' },
      { name: 'The child’s drawing', detail: 'A local resident produces a drawing of the building dated twelve years earlier.', status: 'UNVERIFIED' }
    ],
    characters: [
      { name: 'Imani Cross', role: 'Image intelligence specialist', detail: 'Finds inconsistencies others have overlooked.' },
      { name: 'Jonas Vale', role: 'Facilities contractor', detail: 'Claims the compound was empty when he arrived.' },
      { name: 'Ari Sen', role: 'Local archivist', detail: 'Has kept records of unexplained changes in the valley.' }
    ],
    timeline: [
      { time: '08:10', event: 'Satellite image anomaly is flagged.' },
      { time: '10:25', event: 'Construction records are requested.' },
      { time: '13:50', event: 'A matching structure is found in an older image.' },
      { time: '16:05', event: 'The compound visitor register is reported missing.' }
    ],
    locations: [
      { name: 'Ashen Glass Compound', detail: 'A stark concrete facility surrounded by dry woodland.' },
      { name: 'North Valley Records Office', detail: 'A small municipal archive with incomplete land surveys.' },
      { name: 'The Old Observatory', detail: 'A disused hilltop building with a clear view of the valley.' }
    ],
    stakes: 'The anomaly could expose a fabricated history, a decades-long cover story, or a deliberate attempt to rewrite the valley’s records.',
    visualDirection: 'Dusty satellite imagery, desaturated landscapes, photocopied files, redacted pages and distant silhouettes.',
    nextBeat: 'Ari finds a land survey with the compound drawn in the exact place, signed by an official who died before the valley was mapped.',
    openQuestions: ['Who altered the construction records?', 'Why do the old photographs match?', 'What happened on the compound’s opening day?']
  }
];

function safeText(value, fallback, max = 240) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;
}

function makeDemo(input) {
  const base = demoDossiers[Math.floor(Math.random() * demoDossiers.length)];
  const setting = safeText(input.setting, 'an isolated location', 100);
  const incident = safeText(input.incident, base.incident, 220);
  return {
    ...base,
    title: base.title,
    logline: `${base.logline} The investigation begins in ${setting}.`,
    incident,
    visualDirection: `${base.visualDirection} Setting: ${setting}.`,
    mode: 'DEMO'
  };
}

app.post('/api/generate', async (req, res) => {
  const input = {
    genre: safeText(req.body.genre, 'Mystery thriller', 80),
    setting: safeText(req.body.setting, 'Remote facility', 100),
    tone: safeText(req.body.tone, 'Dark, tense and cinematic', 100),
    incident: safeText(req.body.incident, 'A routine report reveals something impossible.', 500),
    extra: safeText(req.body.extra, 'None', 500)
  };

  if (!client) return res.json(makeDemo(input));

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      instructions: `You are BLACKSITE, a fiction-only intelligence thriller story-world generator. Create compelling fictional mysteries and cinematic pre-action tension. Do not provide real operational, tactical, weapons, surveillance-evasion, or combat instructions. Return only valid JSON with this exact structure: {"title":"string","classification":"string","logline":"string","incident":"string","clues":[{"name":"string","detail":"string","status":"string"}],"characters":[{"name":"string","role":"string","detail":"string"}],"timeline":[{"time":"string","event":"string"}],"locations":[{"name":"string","detail":"string"}],"stakes":"string","visualDirection":"string","nextBeat":"string","openQuestions":["string"]}. Include 3 clues, 3 characters, 4 timeline entries, 3 locations and 3 open questions. Keep details vivid, coherent and original. No markdown fences.`,
      input: `Generate a new dossier. Genre: ${input.genre}. Setting: ${input.setting}. Tone: ${input.tone}. Starting incident: ${input.incident}. Additional direction: ${input.extra}. Make it feel like the opening of a premium action-thriller series, before any action begins.`
    });
    const raw = response.output_text || '';
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('The AI returned an unreadable dossier. Please try again.');
    const dossier = JSON.parse(raw.slice(start, end + 1));
    dossier.classification = 'RESTRICTED // FICTIONAL';
    dossier.mode = 'LIVE AI';
    res.json(dossier);
  } catch (error) {
    console.error('Generation error:', error.message);
    res.status(502).json({ error: 'AI generation failed. Check your API key, model setting and API account, then try again.' });
  }
});

app.get('/api/status', (_req, res) => res.json({ mode: client ? 'LIVE AI' : 'DEMO', ready: true }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`BLACKSITE running at http://localhost:${port}`));
