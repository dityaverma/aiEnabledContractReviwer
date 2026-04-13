/* ═══════════════════════════════════════════
   AI PROVIDERS
   Handles all API calls for every provider.
   Supports: demo, gemini, groq, claude
   ═══════════════════════════════════════════ */

const AI = {

  /* ── State ── */
  provider: 'demo',
  key: '',

  /* ── Load saved settings from browser ── */
  load() {
    this.provider = localStorage.getItem('lexis_provider') || 'demo';
    this.key      = localStorage.getItem('lexis_key')      || '';
  },

  /* ── Save ── */
  save() {
    localStorage.setItem('lexis_provider', this.provider);
    localStorage.setItem('lexis_key',      this.key);
  },

  /* ── Check if a real key is set ── */
  hasKey() {
    return this.key && this.key.trim().length > 8;
  },

  /* ══════════════════════════════════════
     ANALYZE — returns full result object
     ══════════════════════════════════════ */
  async analyze(contractText) {
    if (this.provider === 'demo') {
      return this._demoAnalyze();
    }

    const prompt = this._buildAnalysisPrompt(contractText);

    let raw = '';
    if (this.provider === 'gemini') {
      raw = await this._callGemini(prompt);
    } else if (this.provider === 'groq') {
      raw = await this._callGroq(prompt);
    } else if (this.provider === 'claude') {
      raw = await this._callClaude([{ role: 'user', content: prompt }]);
    }

    return this._parseJSON(raw);
  },

  /* ══════════════════════════════════════
     CHAT — returns reply string
     ══════════════════════════════════════ */
  async chat(messages, contractContext) {
    const system = `You are an expert AI legal assistant helping analyze a contract.
Contract context: ${contractContext || 'No contract loaded yet.'}
Be concise, practical, and legally precise. Max 150 words.
Always recommend consulting a qualified lawyer for binding decisions.`;

    if (this.provider === 'demo') {
      return this._demoChat(messages[messages.length - 1].content);
    }

    if (this.provider === 'gemini') {
      return this._callGeminiChat(messages, system);
    } else if (this.provider === 'groq') {
      return this._callGroqChat(messages, system);
    } else if (this.provider === 'claude') {
      return this._callClaude(messages, system);
    }
    return 'No AI provider configured.';
  },

  /* ══════════════════════════════════════
     GOOGLE GEMINI
     Free tier: 1M tokens/day, 15 req/min
     Get key: aistudio.google.com
     ══════════════════════════════════════ */
  async _callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.key}`;
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Gemini error: ${err.error?.message || res.status}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  async _callGeminiChat(messages, system) {
    // Gemini uses 'contents' array with role 'user'/'model'
    const contents = [];
    // Prepend system as first user message
    contents.push({ role: 'user', parts: [{ text: system }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood. I am ready to assist with the contract analysis.' }] });
    for (const m of messages) {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      });
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.key}`;
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.3, maxOutputTokens: 600 } }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Gemini error: ${err.error?.message || res.status}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
  },

  /* ══════════════════════════════════════
     GROQ (Llama 3)
     Free tier: 14,400 req/day
     Get key: console.groq.com
     OpenAI-compatible API
     ══════════════════════════════════════ */
  async _callGroq(prompt) {
    return this._callOpenAICompat(
      'https://api.groq.com/openai/v1/chat/completions',
      'llama-3.1-8b-instant',
      [{ role: 'user', content: prompt }],
      null
    );
  },

  async _callGroqChat(messages, system) {
    return this._callOpenAICompat(
      'https://api.groq.com/openai/v1/chat/completions',
      'llama-3.1-8b-instant',
      messages,
      system
    );
  },

  /* ══════════════════════════════════════
     ANTHROPIC CLAUDE
     Free credits on new account
     Get key: console.anthropic.com
     ══════════════════════════════════════ */
  async _callClaude(messages, system) {
    const body = {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages,
    };
    if (system) body.system = system;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            this.key,
        'anthropic-version':    '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Claude error: ${err.error?.message || res.status}`);
    }
    const data = await res.json();
    return data.content?.map(b => b.text || '').join('') || '';
  },

  /* ══════════════════════════════════════
     OpenAI-compatible helper (Groq, etc.)
     ══════════════════════════════════════ */
  async _callOpenAICompat(url, model, messages, system) {
    const msgs = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages;

    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${this.key}`,
      },
      body: JSON.stringify({ model, messages: msgs, max_tokens: 2000, temperature: 0.2 }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`API error: ${err.error?.message || res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  },

  /* ══════════════════════════════════════
     DEMO MODE — instant local responses
     ══════════════════════════════════════ */
  _demoAnalyze() {
    // Returns the pre-built demo result from demo-data.js
    return Promise.resolve(JSON.parse(JSON.stringify(DEMO_RESULT)));
  },

  _demoChat(question) {
    const q = question.toLowerCase();
    let answer = '';

    if (q.includes('biggest risk') || q.includes('main risk') || q.includes('worst')) {
      answer = "The biggest risk is the severely imbalanced termination clause — the Supplier can exit with 7 days notice while you (the Buyer) need to give 90 days. This means you're locked in with very little flexibility. The unilateral amendment right is a close second: the Supplier can change contract terms without your agreement.";
    } else if (q.includes('terminat')) {
      answer = "The termination clause is heavily one-sided. Supplier exits with 7 days notice; Buyer needs 90 days. This 13x imbalance means you're effectively locked into the contract while the Supplier is free to leave. Negotiate for equal notice periods — 30 days each is a fair standard.";
    } else if (q.includes('negotiat') || q.includes('change') || q.includes('fix')) {
      answer = "Top 3 things to negotiate: (1) Equal termination notice — propose 30 days each instead of 7 vs 90. (2) Define payment timeline — replace 'reasonable time' with Net-30. (3) Remove or limit the Supplier's unilateral amendment right — require mutual written consent for any changes.";
    } else if (q.includes('payment')) {
      answer = "The payment clause says 'within a reasonable time' — this is legally vague and unenforceable. There's also no late payment penalty, which means the Buyer can delay indefinitely with no consequence. Request a specific term like Net-30 or Net-45, and add a 1.5% monthly interest penalty for overdue payments.";
    } else if (q.includes('vague') || q.includes('undefined') || q.includes('ambiguous')) {
      answer = "Three vague terms stand out: (1) 'Reasonable time' in the payment clause — no specific days defined. (2) 'Timely manner' in delivery — no SLA or deadline. (3) 'Reasonable notice' in the amendments clause — Supplier can change terms with ambiguous notice. All three should be replaced with specific, measurable timeframes.";
    } else if (q.includes('ip') || q.includes('intellectual property') || q.includes('ownership')) {
      answer = "The IP clause is a serious red flag. All intellectual property developed during the agreement belongs to the Supplier — even if you fund it. If your company is contributing resources, ideas, or funding to any development, negotiate to either co-own the IP or have it assigned to whoever funded the development.";
    } else if (q.includes('safe') || q.includes('sign') || q.includes('okay') || q.includes('ok')) {
      answer = "This contract has a risk score of 8.4/10 — I would not recommend signing it as-is. There are 5 high-severity issues including an unfair termination clause, a Supplier-controlled amendment right, and an IP clause that strips your ownership. Negotiate at minimum the termination notice, payment terms, IP rights, and amendment process before signing.";
    } else if (q.includes('summary') || q.includes('overview') || q.includes('about')) {
      answer = "This is a 10-clause Supplier Agreement with a risk score of 8.4/10 (High). Key issues: (1) One-sided termination (7 vs 90 days), (2) Vague payment and delivery timelines, (3) IP goes to Supplier regardless of funding, (4) Supplier can amend terms unilaterally, (5) Low liability cap of one month's payment. Significant renegotiation is needed before signing.";
    } else {
      answer = "Based on the contract analysis, this agreement has several high-risk provisions that heavily favour the Supplier. The risk score is 8.4/10. I'd recommend reviewing the termination clause, payment terms, IP ownership, and amendment rights before proceeding. Is there a specific clause you'd like me to explain in more detail?";
    }

    return Promise.resolve(answer);
  },

  /* ── Parse JSON response from any AI ── */
  _parseJSON(raw) {
    try {
      const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      // Find the first { and last } to extract JSON
      const start = clean.indexOf('{');
      const end   = clean.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON found');
      return JSON.parse(clean.slice(start, end + 1));
    } catch (e) {
      throw new Error('AI returned invalid JSON. Try again or use Demo mode.');
    }
  },

  /* ── Build the analysis prompt ── */
  _buildAnalysisPrompt(text) {
    return `You are an expert legal AI. Analyze this contract carefully.
Respond ONLY with valid JSON — no markdown, no backticks, no explanation outside the JSON object.

JSON structure required:
{
  "summary": "2-3 sentence plain-English summary of the contract",
  "risk_score": <number from 1.0 to 10.0>,
  "risk_level": "Low" or "Medium" or "High",
  "clauses": [
    { "name": "clause name", "risk": "high" or "medium" or "low", "type": "Payment/Termination/Liability/NDA/Delivery/IP/Jurisdiction/Other", "text": "one sentence extract" }
  ],
  "obligations": [
    { "party": "party name", "action": "what they must do", "deadline": "specific deadline or Undefined or Vague" }
  ],
  "issues": [
    { "severity": "high" or "medium" or "low", "title": "short title", "desc": "explanation" }
  ],
  "recommendations": ["action item 1", "action item 2", ...]
}

Contract text (analyze thoroughly):
${text.slice(0, 4000)}`;
  },
};
