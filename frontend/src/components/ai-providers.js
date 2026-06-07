const AI = {

  provider: 'demo',
  key:      '',
  baseUrl:  'http://localhost:8000/api',

  load() {
    this.provider = localStorage.getItem('lexis_provider') || 'demo';
    this.key      = localStorage.getItem('lexis_key')      || '';
  },

  save() {
    localStorage.setItem('lexis_provider', this.provider);
    localStorage.setItem('lexis_key',      this.key);
  },

  hasKey() {
    return this.key && this.key.trim().length > 8;
  },

  async analyze(contractText) {
    if (this.provider === 'demo') {
      return this._demoAnalyze();
    }

    const res = await fetch(`${this.baseUrl}/analyze`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text:     contractText,
        provider: this.provider,
        api_key:  this.key || null
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Analysis failed');
    }

    return await res.json();
  },

  async chat(messages, contractContext) {
    if (this.provider === 'demo') {
      return this._demoChat(messages[messages.length - 1].content);
    }

    const res = await fetch(`${this.baseUrl}/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        contract_context: contractContext,
        provider:         this.provider,
        api_key:          this.key || null
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Chat failed');
    }

    const data = await res.json();
    return data.reply;
  },

  _demoAnalyze() {
    return Promise.resolve(JSON.parse(JSON.stringify(DEMO_RESULT)));
  },

  _demoChat(question) {
    const q = question.toLowerCase();
    let answer = '';

    if (q.includes('biggest risk') || q.includes('main risk') || q.includes('worst')) {
      answer = "The biggest risk is the severely imbalanced termination clause — the Supplier can exit with 7 days notice while you (the Buyer) need to give 90 days. This means you're locked in [...]";
    } else if (q.includes('terminat')) {
      answer = "The termination clause is heavily one-sided. Supplier exits with 7 days notice; Buyer needs 90 days. This 13x imbalance means you're effectively locked into the contract while the [...]";
    } else if (q.includes('negotiat') || q.includes('change') || q.includes('fix')) {
      answer = "Top 3 things to negotiate: (1) Equal termination notice — propose 30 days each instead of 7 vs 90. (2) Define payment timeline — replace 'reasonable time' with Net-30. (3) Rem [...]";
    } else if (q.includes('payment')) {
      answer = "The payment clause says 'within a reasonable time' — this is legally vague and unenforceable. There's also no late payment penalty, which means the Buyer can delay indefinitely [...]";
    } else if (q.includes('vague') || q.includes('undefined') || q.includes('ambiguous')) {
      answer = "Three vague terms stand out: (1) 'Reasonable time' in the payment clause — no specific days defined. (2) 'Timely manner' in delivery — no SLA or deadline. (3) 'Reasonable noti [...]";
    } else if (q.includes('ip') || q.includes('intellectual property') || q.includes('ownership')) {
      answer = "The IP clause is a serious red flag. All intellectual property developed during the agreement belongs to the Supplier — even if you fund it. If your company is contributing reso [...]";
    } else if (q.includes('safe') || q.includes('sign') || q.includes('okay') || q.includes('ok')) {
      answer = "This contract has a risk score of 8.4/10 — I would not recommend signing it as-is. There are 5 high-severity issues including an unfair termination clause, a Supplier-controlled [...]";
    } else if (q.includes('summary') || q.includes('overview') || q.includes('about')) {
      answer = "This is a 10-clause Supplier Agreement with a risk score of 8.4/10 (High). Key issues: (1) One-sided termination (7 vs 90 days), (2) Vague payment and delivery timelines, (3) IP g [...]";
    } else {
      answer = "Based on the contract analysis, this agreement has several high-risk provisions that heavily favour the Supplier. The risk score is 8.4/10. I'd recommend reviewing the termination [...]";
    }

    return Promise.resolve(answer);
  },
};