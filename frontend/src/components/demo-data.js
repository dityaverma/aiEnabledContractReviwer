/* ═══════════════════════════════════════════
   DEMO DATA — realistic contract analysis
   Used when provider = 'demo' (no API key needed)
   ═══════════════════════════════════════════ */

const DEMO_CONTRACT_TEXT = `SUPPLIER AGREEMENT

This Supplier Agreement ("Agreement") is entered into as of January 1, 2026, between
TechBuyer Pvt. Ltd. ("Buyer") and Acme Industrial Supplies ("Supplier").

1. PAYMENT TERMS
The Buyer shall remit payment within a reasonable time after receipt of invoice.
No late payment penalty clause is included.

2. DELIVERY OBLIGATIONS
The Supplier shall deliver all goods in a timely manner as the Supplier deems appropriate.
No specific delivery timeline or SLA is defined.

3. TERMINATION
Either party may terminate this Agreement. However, the Supplier may terminate with
7 days written notice, while the Buyer must provide 90 days written notice.

4. LIABILITY
The total liability of either party under this Agreement shall not exceed the value of
a single month's payment. This cap applies regardless of the cause or type of damage.

5. CONFIDENTIALITY
Both parties agree to keep all proprietary and business information confidential for
a period of five (5) years from the date of disclosure.

6. INTELLECTUAL PROPERTY
All intellectual property developed during the course of this agreement shall remain
the property of the Supplier, regardless of who funded the development.

7. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of
the jurisdiction where the Supplier is headquartered.

8. FORCE MAJEURE
Neither party shall be liable for delays or failures in performance resulting from
circumstances beyond their reasonable control.

9. AMENDMENTS
This Agreement may be amended at any time at the sole discretion of the Supplier.
The Buyer shall be notified of changes within a reasonable time.

10. DISPUTE RESOLUTION
Any disputes arising under this Agreement shall be resolved through binding arbitration
at a location chosen by the Supplier, with costs shared equally.`;

const DEMO_RESULT = {
  summary: "This Supplier Agreement between TechBuyer Pvt. Ltd. and Acme Industrial Supplies governs the supply of industrial goods. The contract spans 10 clauses including payment, delivery, termination, and IP rights. Several provisions are heavily one-sided in favour of the Supplier, with vague language throughout and missing standard buyer protections.",
  risk_score: 8.4,
  risk_level: "High",
  clauses: [
    { name: "Payment terms",         risk: "high",   type: "Payment",        text: "Buyer shall remit payment within a reasonable time after receipt of invoice." },
    { name: "Delivery obligations",  risk: "high",   type: "Delivery",       text: "Supplier shall deliver goods in a timely manner as the Supplier deems appropriate." },
    { name: "Termination",           risk: "high",   type: "Termination",    text: "Supplier may terminate with 7 days notice; Buyer must give 90 days notice." },
    { name: "Liability cap",         risk: "high",   type: "Liability",      text: "Total liability capped at one month's payment regardless of cause." },
    { name: "Intellectual property", risk: "high",   type: "IP",             text: "All IP developed during agreement remains Supplier's property regardless of funding." },
    { name: "Amendments",            risk: "medium", type: "Governance",     text: "Agreement may be amended at sole discretion of the Supplier with reasonable notice." },
    { name: "Governing law",         risk: "medium", type: "Jurisdiction",   text: "Governed by law of Supplier's jurisdiction — no mutual agreement on venue." },
    { name: "Dispute resolution",    risk: "medium", type: "Dispute",        text: "Binding arbitration at a location chosen by Supplier, costs shared equally." },
    { name: "Confidentiality",       risk: "low",    type: "NDA",            text: "Both parties maintain confidentiality for 5 years from disclosure." },
    { name: "Force majeure",         risk: "low",    type: "Force Majeure",  text: "Neither party liable for delays caused by circumstances beyond reasonable control." },
  ],
  obligations: [
    { party: "Buyer",    action: "Remit payment after invoice",         deadline: "Undefined" },
    { party: "Supplier", action: "Deliver goods to agreed location",    deadline: "Vague" },
    { party: "Buyer",    action: "Provide termination notice",          deadline: "90 days" },
    { party: "Supplier", action: "Provide termination notice",          deadline: "7 days" },
    { party: "Both",     action: "Maintain confidentiality",            deadline: "5 years" },
    { party: "Buyer",    action: "Accept unilateral amendments",        deadline: "Reasonable time" },
    { party: "Both",     action: "Share arbitration costs",             deadline: "On dispute" },
  ],
  issues: [
    { severity: "high",   title: "Severely imbalanced termination",   desc: "Supplier exits with 7 days; Buyer needs 90 days — a 13x imbalance." },
    { severity: "high",   title: "Vague payment deadline",            desc: '"Reasonable time" is legally undefined and unenforceable as written.' },
    { severity: "high",   title: "Vague delivery timeline",           desc: '"Timely manner" gives Supplier full discretion with no SLA or remedy.' },
    { severity: "high",   title: "Unfair IP ownership",               desc: "Buyer-funded development still becomes Supplier's IP — major risk." },
    { severity: "high",   title: "Supplier-controlled amendments",    desc: "Supplier can change contract terms unilaterally at any time." },
    { severity: "medium", title: "Low liability cap",                 desc: "One-month cap likely insufficient for major supply chain failures." },
    { severity: "medium", title: "Supplier-chosen arbitration venue", desc: "Buyer has no input on where disputes are heard — disadvantageous." },
    { severity: "medium", title: "No late payment penalty",           desc: "Missing standard protection clause — Buyer can delay indefinitely." },
    { severity: "low",    title: "Supplier jurisdiction for law",     desc: "Governing law favours Supplier's home jurisdiction, not neutral." },
  ],
  recommendations: [
    "Replace 'reasonable time' in payment clause with a specific term: Net-30 or Net-45 days from invoice.",
    "Negotiate equal termination notice periods — propose 30 days for both parties.",
    "Add a late payment penalty clause (e.g., 1.5% monthly interest on overdue amounts).",
    "Define 'timely manner' in delivery with a concrete SLA (e.g., 14 business days) and a penalty for breach.",
    "Renegotiate IP clause: Buyer should own IP developed with Buyer's funding.",
    "Remove or restrict the Supplier's unilateral amendment right — require mutual written consent.",
    "Negotiate a higher liability cap — typically 12 months of contract value is a standard floor.",
    "Specify a neutral arbitration venue or use a recognized body (e.g., ICC, LCIA).",
  ],
};
