/* ═══════════════════════════════════════════
   ANALYSIS ENGINE
   Manages the analysis pipeline:
   progress steps → AI call → UI population
   ═══════════════════════════════════════════ */

const Engine = {

  /* Current analysis result stored here */
  lastResult:  null,
  lastText:    '',
  contracts:   [],   /* in-session contract history */

  /* ── Run full analysis ── */
  async run(contractText) {
    this.lastText = contractText;

    /* Show progress screen */
    goSub('analyzing');
    document.getElementById('prog-mode-label').textContent =
      AI.provider === 'demo'
        ? 'Running demo analysis (no API key needed)'
        : `Analyzing with ${this._providerLabel(AI.provider)}…`;

    /* Animate progress steps */
    const STEPS   = ['s1','s2','s3','s4','s5','s6'];
    const PERCENTS = [15, 30, 50, 65, 82, 100];

    /* Start AI call in parallel with animation */
    const aiPromise = AI.analyze(contractText).catch(err => {
      return { _error: err.message };
    });

    for (let i = 0; i < STEPS.length; i++) {
      await _delay(AI.provider === 'demo' ? 500 : 700);
      if (i > 0) _setStep(STEPS[i-1], 'done');
      _setStep(STEPS[i], 'active');
      const fill = document.getElementById('pf');
      if (fill) fill.style.width = PERCENTS[i] + '%';
    }

    /* Wait for AI */
    const result = await aiPromise;
    _setStep(STEPS[STEPS.length - 1], 'done');
    await _delay(350);

    if (result._error) {
      alert('Analysis error: ' + result._error + '\n\nTry Demo mode in Settings or check your API key.');
      goSub('upload');
      return;
    }

    /* Store + populate */
    this.lastResult = result;
    this._saveToHistory(result, contractText);
    this._populateUI(result);
    updateDashboard();
    goSub('analysis');
  },

  /* ── Populate every section of the analysis page ── */
  _populateUI(r) {
    /* Summary */
    _setText('a-summary', r.summary || 'No summary available.');

    /* Risk score */
    const score   = parseFloat(r.risk_score) || 0;
    const scoreEl = document.getElementById('a-score');
    if (scoreEl) {
      scoreEl.textContent = score.toFixed(1);
      scoreEl.className   = 'score-num ' + _scoreClass(score);
    }
    _setText('a-score-label', `out of 10 — ${r.risk_level || 'Unknown'} risk`);
    const clauseCount = r.clauses?.length || 0;
    const issueCount  = r.issues?.length  || 0;
    _setText('a-score-meta', `${issueCount} issues across ${clauseCount} clauses`);

    /* Clause count badge */
    _setText('clause-count', clauseCount);
    _setText('issue-count',  issueCount);

    /* Clauses */
    if (r.clauses?.length) {
      _setHTML('a-clauses', r.clauses.map(c => `
        <div class="clause-item">
          <div class="cl-head">
            <span class="cl-name">${_esc(c.name)}</span>
            <span class="badge ${_riskBadge(c.risk)}">${_cap(c.risk)} risk</span>
          </div>
          <div class="cl-text">${_esc(c.text)}</div>
        </div>`).join(''));
    } else {
      _setHTML('a-clauses', '<div class="empty-state">No clauses detected</div>');
    }

    /* Obligations */
    if (r.obligations?.length) {
      const rows = r.obligations.map(o => `
        <tr>
          <td class="obl-party">${_esc(o.party)}</td>
          <td class="obl-action">${_esc(o.action)}</td>
          <td class="obl-dead">${_esc(o.deadline)}</td>
        </tr>`).join('');
      _setHTML('a-obligations', `
        <table class="obl-table">
          <thead><tr>
            <th>Party</th><th>Obligation</th><th>Deadline</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`);
    } else {
      _setHTML('a-obligations', '<div class="empty-state">No obligations extracted</div>');
    }

    /* Issues */
    if (r.issues?.length) {
      _setHTML('a-issues', r.issues.map(i => `
        <div class="issue-item i-${_sevClass(i.severity)}">
          <div class="i-title">${_esc(i.title)}</div>
          <div class="i-desc">${_esc(i.desc)}</div>
        </div>`).join(''));
    } else {
      _setHTML('a-issues', '<div class="empty-state">No issues detected — looks clean!</div>');
    }

    /* Recommendations */
    if (r.recommendations?.length) {
      _setHTML('a-recs', r.recommendations.map((rec, i) => `
        <div class="rec-item">
          <div class="rec-n">${i + 1}</div>
          <div>${_esc(rec)}</div>
        </div>`).join(''));
    } else {
      _setHTML('a-recs', '<div class="empty-state">No recommendations</div>');
    }
  },

  /* ── Save to in-session history ── */
  _saveToHistory(result, text) {
    const entry = {
      id:         Date.now(),
      name:       this._guessName(text),
      type:       this._guessType(result),
      risk_score: parseFloat(result.risk_score) || 0,
      risk_level: result.risk_level || 'Unknown',
      clauses:    result.clauses?.length || 0,
      status:     'analyzed',
      result,
      text,
    };
    this.contracts.unshift(entry);
  },

  /* ── Guess contract name from text ── */
  _guessName(text) {
    const lines = text.trim().split('\n').slice(0, 6);
    for (const line of lines) {
      const t = line.trim();
      if (t.length > 4 && t.length < 80 && /agreement|contract|nda|lease|license|terms/i.test(t)) {
        return t.replace(/["*#]/g, '').trim();
      }
    }
    return 'Contract ' + new Date().toLocaleDateString();
  },

  /* ── Guess contract type from clause types ── */
  _guessType(result) {
    const types = (result.clauses || []).map(c => (c.type || '').toLowerCase());
    if (types.includes('nda'))         return 'NDA';
    if (types.includes('ip'))          return 'IP / License';
    if (types.includes('payment'))     return 'Supply';
    if (types.includes('employment'))  return 'HR';
    return 'General';
  },

  _providerLabel(p) {
    return { gemini: 'Google Gemini', groq: 'Groq (Llama 3)', claude: 'Claude', demo: 'Demo' }[p] || p;
  },

  /* ── Export plain text report ── */
  exportReport() {
    const r = this.lastResult;
    if (!r) { alert('No analysis to export yet.'); return; }

    let txt = `LEXIS AI — CONTRACT ANALYSIS REPORT\n`;
    txt    += `Generated: ${new Date().toLocaleString()}\n`;
    txt    += `${'═'.repeat(50)}\n\n`;

    txt    += `SUMMARY\n${'-'.repeat(30)}\n${r.summary}\n\n`;
    txt    += `RISK SCORE: ${parseFloat(r.risk_score).toFixed(1)} / 10 (${r.risk_level})\n\n`;

    txt    += `DETECTED CLAUSES (${r.clauses?.length || 0})\n${'-'.repeat(30)}\n`;
    (r.clauses || []).forEach(c => {
      txt += `• [${c.risk.toUpperCase()}] ${c.name} — ${c.text}\n`;
    });

    txt    += `\nOBLIGATIONS\n${'-'.repeat(30)}\n`;
    (r.obligations || []).forEach(o => {
      txt += `• ${o.party}: ${o.action} (${o.deadline})\n`;
    });

    txt    += `\nDETECTED ISSUES\n${'-'.repeat(30)}\n`;
    (r.issues || []).forEach(i => {
      txt += `• [${i.severity.toUpperCase()}] ${i.title}: ${i.desc}\n`;
    });

    txt    += `\nRECOMMENDATIONS\n${'-'.repeat(30)}\n`;
    (r.recommendations || []).forEach((rec, i) => {
      txt += `${i + 1}. ${rec}\n`;
    });

    txt    += `\n${'═'.repeat(50)}\nNote: This report is for educational purposes only. Not legal advice.\n`;

    /* Trigger download */
    const blob = new Blob([txt], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'lexis-ai-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  },
};

/* ═══════════════════════════════════════════
   SHARED UTILITY FUNCTIONS
   ═══════════════════════════════════════════ */
function _delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function _setStep(id, state) {
  const el = document.getElementById(id);
  if (el) el.className = 'step ' + state;
}

function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(val);
}

function _setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function _esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _cap(s)  { return String(s||'').charAt(0).toUpperCase() + String(s||'').slice(1); }

function _riskBadge(risk) {
  return risk === 'high' ? 'b-high' : risk === 'medium' ? 'b-med' : 'b-low';
}

function _sevClass(sev) {
  return sev === 'high' ? 'high' : sev === 'medium' ? 'med' : 'low';
}

function _scoreClass(score) {
  return score >= 7 ? 'score-high' : score >= 4 ? 'score-med' : 'score-low';
}
