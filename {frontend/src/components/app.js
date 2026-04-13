/* ═══════════════════════════════════════════
   LEXIS AI — MAIN APP
   Navigation, settings, chat, dashboard
   ═══════════════════════════════════════════ */

/* ── Page/subpage titles ── */
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  upload:    'Upload contract',
  analysis:  'Risk analysis',
  analyzing: 'Analyzing…',
  chat:      'Ask AI lawyer',
  settings:  'AI settings',
};
const SIDEBAR_IDS = ['dashboard', 'upload', 'analysis', 'chat', 'settings'];

/* Chat history (in memory per session) */
let chatHistory = [];

/* ═══════════════════════════════════════════
   INIT — runs on page load
   ═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  AI.load();
  updateProviderUI();
  updateDashboard();
  updateApiPill();
});

/* ═══════════════════════════════════════════
   PAGE NAVIGATION
   ═══════════════════════════════════════════ */
function goApp() {
  showPage('pg-app');
  goSub('dashboard');
}

function goLanding() {
  showPage('pg-landing');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  const el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function goSub(name) {
  document.querySelectorAll('.subpage').forEach(s => s.classList.remove('on'));
  const sub = document.getElementById('sub-' + name);
  if (sub) sub.classList.add('on');

  _setText('tb-title', PAGE_TITLES[name] || name);

  SIDEBAR_IDS.forEach(k => {
    const el = document.getElementById('si-' + k);
    if (el) el.classList.toggle('active', k === name);
  });
}

/* ═══════════════════════════════════════════
   UPLOAD & FILE HANDLING
   ═══════════════════════════════════════════ */
function handleFile(input) {
  if (!input.files?.[0]) return;
  const file = input.files[0];

  /* Show filename */
  document.getElementById('dz').innerHTML = `
    <div class="dz-icon">
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#4caf7d" stroke-width="1.5">
        <path d="M4 10l4 4 8-8"/>
      </svg>
    </div>
    <div class="dz-title">${_esc(file.name)}</div>
    <div class="dz-sub" style="color:var(--green)">Ready to analyze</div>`;

  /* Read .txt files */
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('ct-text').value = e.target.result;
    };
    reader.readAsText(file);
  }
  /* For PDF/DOCX in frontend-only mode, show message */
  else {
    const current = document.getElementById('ct-text').value;
    if (!current.trim()) {
      document.getElementById('ct-text').placeholder =
        `PDF/DOCX parsing requires the backend server.\n\nFor the frontend-only demo, please paste the contract text into this box instead.\n\nFile selected: ${file.name}`;
    }
  }
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById('dz').classList.remove('dragover');
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    const input = document.getElementById('fi');
    /* Simulate file selection */
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    handleFile(input);
  }
}

/* ═══════════════════════════════════════════
   START ANALYSIS
   ═══════════════════════════════════════════ */
async function startAnalysis() {
  const text = document.getElementById('ct-text').value.trim();
  if (!text) {
    alert('Please paste some contract text or upload a .txt file first.');
    return;
  }
  if (text.length < 30) {
    alert('Contract text is too short. Please paste more content.');
    return;
  }
  /* Reset chat when new contract loaded */
  chatHistory = [];
  resetChat();
  await Engine.run(text);
}

/* ── Load demo contract ── */
function loadDemo() {
  goSub('upload');
  document.getElementById('ct-text').value = DEMO_CONTRACT_TEXT;
  document.getElementById('dz').innerHTML = `
    <div class="dz-icon">
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#7c6dfa" stroke-width="1.5">
        <path d="M10 13V5M7 8l3-3 3 3"/><path d="M3 14v1a3 3 0 003 3h8a3 3 0 003-3v-1"/>
      </svg>
    </div>
    <div class="dz-title">Demo: Supplier Agreement</div>
    <div class="dz-sub" style="color:var(--accent)">Demo contract loaded — click Analyze</div>`;
}

/* ── Export report ── */
function exportReport() {
  Engine.exportReport();
}

/* ═══════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════ */
function updateDashboard() {
  const contracts = Engine.contracts;
  const total  = contracts.length;
  const high   = contracts.filter(c => c.risk_level === 'High').length;
  const medium = contracts.filter(c => c.risk_level === 'Medium').length;
  const low    = contracts.filter(c => c.risk_level === 'Low').length;

  _setText('m-total', total);
  _setText('m-high',  high);
  _setText('m-med',   medium);
  _setText('m-low',   low);

  const rowsEl = document.getElementById('contract-rows');
  if (!rowsEl) return;

  if (contracts.length === 0) {
    rowsEl.innerHTML = `<div class="ct-empty">No contracts analyzed yet. <span onclick="goSub('upload')" style="color:var(--accent);cursor:pointer">Upload one →</span></div>`;
    return;
  }

  rowsEl.innerHTML = contracts.map(c => `
    <div class="ct-row" onclick="loadContractResult('${c.id}')">
      <span class="ct-name">${_esc(c.name)}</span>
      <span class="ct-meta">${_esc(c.type)}</span>
      <span><span class="badge ${_riskBadge(c.risk_level.toLowerCase())}">${c.risk_level} · ${c.risk_score.toFixed(1)}</span></span>
      <span><span class="badge b-done">Done</span></span>
      <span class="ct-meta">${c.clauses} clauses</span>
    </div>`).join('');
}

function loadContractResult(id) {
  const contract = Engine.contracts.find(c => String(c.id) === String(id));
  if (!contract) return;
  Engine.lastResult = contract.result;
  Engine.lastText   = contract.text;
  Engine._populateUI(contract.result);
  goSub('analysis');
}

/* ═══════════════════════════════════════════
   AI CHAT
   ═══════════════════════════════════════════ */
async function sendMsg() {
  const input = document.getElementById('chat-in');
  const q     = input.value.trim();
  if (!q) return;
  input.value = '';

  appendChatMsg('user', q);
  chatHistory.push({ role: 'user', content: q });

  const thinkId = 'th-' + Date.now();
  const msgsEl  = document.getElementById('chat-msgs');
  msgsEl.innerHTML += `
    <div class="msg ai" id="${thinkId}">
      <div class="dots">
        <div class="dot"></div><div class="dot"></div><div class="dot"></div>
      </div>
    </div>`;
  msgsEl.scrollTop = msgsEl.scrollHeight;

  try {
    const context = Engine.lastText || 'No contract loaded yet.';
    const reply   = await AI.chat(chatHistory, context);
    chatHistory.push({ role: 'assistant', content: reply });
    const el = document.getElementById(thinkId);
    if (el) el.outerHTML = `<div class="msg ai">${_esc(reply)}</div>`;
  } catch (err) {
    const el = document.getElementById(thinkId);
    if (el) el.outerHTML = `<div class="msg ai" style="color:var(--red)">Error: ${_esc(err.message)}</div>`;
  }

  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function quickAsk(question) {
  document.getElementById('chat-in').value = question;
  sendMsg();
}

function appendChatMsg(type, text) {
  const msgsEl = document.getElementById('chat-msgs');
  const div    = document.createElement('div');
  div.className   = 'msg ' + type;
  div.textContent = text;
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function resetChat() {
  chatHistory = [];
  const msgsEl = document.getElementById('chat-msgs');
  if (msgsEl) msgsEl.innerHTML = `
    <div class="msg ai">Contract loaded! Ask me anything about it — risks, specific clauses, what to negotiate, or anything in plain English.</div>`;
}

/* ═══════════════════════════════════════════
   SETTINGS — PROVIDER & API KEY
   ═══════════════════════════════════════════ */
function setProvider(p) {
  AI.provider = p;
  AI.save();
  updateProviderUI();
  updateApiPill();

  /* Show/hide key card */
  const keyCard = document.getElementById('key-card');
  if (keyCard) keyCard.style.display = p === 'demo' ? 'none' : 'block';

  /* Update key hint text */
  const hints = {
    gemini: 'Paste your Google Gemini API key (from aistudio.google.com)',
    groq:   'Paste your Groq API key (from console.groq.com)',
    claude: 'Paste your Anthropic Claude API key (from console.anthropic.com)',
  };
  _setText('key-hint', hints[p] || '');

  /* Pre-fill if key exists */
  const keyInput = document.getElementById('api-key-input');
  if (keyInput) keyInput.value = AI.key || '';
}

function saveKey() {
  const val = document.getElementById('api-key-input')?.value?.trim();
  if (!val) { alert('Please paste your API key first.'); return; }
  AI.key = val;
  AI.save();
  updateApiPill();
  const msg = document.getElementById('key-saved-msg');
  if (msg) { msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 3000); }
}

function updateProviderUI() {
  ['demo','gemini','groq','claude'].forEach(p => {
    const item  = document.getElementById('prov-' + p);
    const radio = document.getElementById('radio-' + p);
    if (item)  item.classList.toggle('selected', AI.provider === p);
    if (radio) radio.className = 'prov-radio' + (AI.provider === p ? ' active' : '');
  });

  const keyCard = document.getElementById('key-card');
  if (keyCard) keyCard.style.display = AI.provider === 'demo' ? 'none' : 'block';

  const keyInput = document.getElementById('api-key-input');
  if (keyInput) keyInput.value = AI.key || '';
}

function updateApiPill() {
  const pill = document.getElementById('api-status');
  if (!pill) return;
  const labels = { demo:'Demo mode', gemini:'Gemini', groq:'Groq', claude:'Claude' };
  const label  = labels[AI.provider] || AI.provider;
  if (AI.provider === 'demo') {
    pill.textContent = '⚙ Demo mode';
    pill.className   = 'api-pill';
  } else if (AI.hasKey()) {
    pill.textContent = `✓ ${label} connected`;
    pill.className   = 'api-pill connected';
  } else {
    pill.textContent = `⚙ ${label} — add key`;
    pill.className   = 'api-pill';
  }
}
