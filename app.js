/* Counsel Triage Escalation Policy Console.
   Loads synthetic member chats, shows AI triage with cited stubs, applies
   an escalation policy through a human gate, then shows care-path impact.
   Everything is pre-recorded synthetic data; no model runs in this browser. */

"use strict";

const POLICY_LABELS = {
  "stay-with-ai": "Stay with Counsel AI",
  "add-doctor": "Add a doctor to chat",
  "urgent-redirect": "Urgent redirect",
  "emergency-guidance": "Emergency guidance",
};

const POLICY_SUBS = {
  "stay-with-ai":
    "Counsel AI keeps the conversation and cites safe self-care guidance.",
  "add-doctor":
    "A board-certified doctor joins this chat, usually in under 10 minutes. $29 per visit.",
  "urgent-redirect":
    "Fast-track this member to an available doctor right now.",
  "emergency-guidance":
    "Show emergency and 911 guidance, and block normal chat continuation.",
};

const POLICY_IMPACT_TITLES = {
  "stay-with-ai": "Member stays on the AI care path",
  "add-doctor": "Doctor joins the conversation",
  "urgent-redirect": "Urgent care path activated",
  "emergency-guidance": "Emergency path activated",
};

let DATA = null;
let currentCase = null;
let currentPolicy = null;

const els = {
  caseGrid: document.getElementById("case-grid"),
  memberStub: document.getElementById("member-stub"),
  chatThread: document.getElementById("chat-thread"),
  policyCard: document.getElementById("policy-card"),
  gateOptions: document.getElementById("gate-options"),
  gateStatus: document.getElementById("gate-status"),
  impactBlock: document.getElementById("impact-block"),
  impactStrip: document.getElementById("impact-strip"),
  emergencyBlock: document.getElementById("emergency-block"),
  emergencyPanel: document.getElementById("emergency-panel"),
  toast: document.getElementById("toast"),
  live: document.getElementById("live-region"),
  reset: document.getElementById("reset"),
};

function announce(text) {
  els.live.textContent = "";
  // Force a fresh announcement on repeated identical text.
  window.setTimeout(() => {
    els.live.textContent = text;
  }, 40);
}

function toast(text) {
  els.toast.textContent = text;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ---------------- case picker ---------------- */

function renderCases() {
  els.caseGrid.textContent = "";
  DATA.cases.forEach((c) => {
    const card = el("button", "case-card");
    card.type = "button";
    card.setAttribute("aria-pressed", c.id === currentCase.id ? "true" : "false");
    card.dataset.id = c.id;
    card.appendChild(el("span", "case-name", c.name));
    card.appendChild(el("span", "case-meta", c.meta));
    const tone = c.tagTone === "red" ? "case-tag case-tag-red"
      : c.tagTone === "amber" ? "case-tag case-tag-amber"
      : "case-tag";
    card.appendChild(el("span", tone, c.tag));
    card.addEventListener("click", () => loadCase(c.id));
    els.caseGrid.appendChild(card);
  });
}

/* ---------------- rendering ---------------- */

function renderMember(c) {
  els.memberStub.textContent = "";
  const avatar = el("div", "avatar", c.member.initials);
  avatar.setAttribute("aria-hidden", "true");
  const info = el("div", "member-info");
  info.appendChild(el("div", "member-name", c.member.name));
  info.appendChild(el("div", "member-facts", c.member.facts));
  const chip = el("span", "member-chip", c.member.chip);
  els.memberStub.append(avatar, info, chip);
}

function renderChat(c) {
  els.chatThread.textContent = "";
  els.chatThread.appendChild(el("p", "turn-meta", c.turnMeta));
  	c.chat.forEach((m) => {
		const bubble = el("div", m.who === "member" ? "bubble-member" : "bubble-ai");
		if (m.who === "ai") {
			const label = el("span", "bubble-label", m.label);
			bubble.appendChild(label);
		}
		bubble.appendChild(el("p", null, m.text));
		if (m.triageChip) {
			bubble.appendChild(el("span", "triage-chip", m.triageChip));
		}
		els.chatThread.appendChild(bubble);
	});
}

function renderPolicy(c) {
  els.policyCard.textContent = "";
  const head = el("div", "policy-head");
  head.appendChild(el("span", "rec-badge", "Recommended"));
  const name = el("p", "policy-name", c.policy.name);
  els.policyCard.appendChild(head);
  els.policyCard.appendChild(name);
  els.policyCard.appendChild(el("p", "policy-rule", c.policy.rule));

  const conf = el("div", "confidence-row");
  const chip1 = el("span", "confidence-chip");
  chip1.textContent = "Confidence ";
  chip1.appendChild(el("strong", null, c.policy.confidence.value));
  const chip2 = el("span", "confidence-chip", "Policy " + c.policy.confidence.policyVersion);
  const chip3 = el("span", "confidence-chip", c.policy.confidence.signals + " signals matched");
  conf.append(chip1, chip2, chip3);
  els.policyCard.appendChild(conf);

  els.policyCard.appendChild(el("p", "citations-title", "Why · cited stubs"));
  const list = el("ul", "citations");
  c.policy.citations.forEach((cit) => {
    const li = el("li", "citation");
    const body = el("div", null);
    body.appendChild(el("span", null, cit.label));
    body.appendChild(el("span", "citation-src", cit.src));
    li.appendChild(body);
    list.appendChild(li);
  });
  els.policyCard.appendChild(list);
}

function renderGate(c) {
  els.gateOptions.textContent = "";
  Object.keys(POLICY_LABELS).forEach((key) => {
    const btn = el("button", "gate-btn");
    btn.type = "button";
    btn.dataset.policy = key;
    btn.setAttribute("aria-pressed", "false");
    const rec = key === c.recommended
      ? el("span", "gate-rec", "Recommended")
      : null;
    const title = el("span", "gate-title", POLICY_LABELS[key]);
    const sub = el("span", "gate-sub", POLICY_SUBS[key]);
    btn.append(rec, title, sub);
    btn.addEventListener("click", () => applyPolicy(key));
    els.gateOptions.appendChild(btn);
  });
}

function renderEmergency(c) {
  els.emergencyBlock.classList.add("hidden");
  if (!c.emergency) return;
  const panel = els.emergencyPanel;
  panel.textContent = "";
  panel.appendChild(el("span", "emergency-label", "SYNTHETIC DEMO LABEL"));
  panel.appendChild(el("h3", null, c.emergency.title));
  panel.appendChild(el("p", null, c.emergency.intro));
  const ol = el("ol", "emergency-steps");
  c.emergency.steps.forEach((s) => ol.appendChild(el("li", null, s)));
  panel.appendChild(ol);
  panel.appendChild(el("p", "emergency-note", c.emergency.note));
  els.emergencyBlock.classList.remove("hidden");
}

/* ---------------- gate + impact ---------------- */

function impactTitle(policyKey) {
  return POLICY_IMPACT_TITLES[policyKey];
}

function renderImpact(c, policyKey) {
  const rows = c.impact[policyKey] || [];
  els.impactStrip.textContent = "";
  const headRow = el("div", "impact-row");
  headRow.classList.add("ok");
  headRow.appendChild(el("span", null, impactTitle(policyKey)));
  els.impactStrip.appendChild(headRow);
  rows.forEach(([label, tone]) => {
    const row = el("div", "impact-row " + tone);
    row.appendChild(el("span", null, label));
    els.impactStrip.appendChild(row);
  });
}

function applyPolicy(policyKey) {
  if (currentPolicy) {
    toast("Select a case or reset to run another path");
    return;
  }
  const c = currentCase;
  const isConfirm = policyKey === c.recommended;
  const status = el("p", null, isConfirm
    ? "Gate confirmed by operator: " + POLICY_LABELS[policyKey] + ". Choice logged to the triage audit."
    : "Operator override: " + POLICY_LABELS[policyKey] + " instead of recommended " + POLICY_LABELS[c.recommended] + ". Override logged to the triage audit.");
  els.gateStatus.textContent = "";
  els.gateStatus.classList.toggle("override", !isConfirm);
  els.gateStatus.classList.remove("hidden");
  els.gateStatus.appendChild(status);

  const buttons = els.gateOptions.querySelectorAll(".gate-btn");
  buttons.forEach((b) => {
    b.disabled = true;
    b.setAttribute("aria-pressed", b.dataset.policy === policyKey ? "true" : "false");
  });

  currentPolicy = policyKey;
  renderImpact(c, policyKey);
  els.impactBlock.classList.remove("hidden");
  if (policyKey === "emergency-guidance") {
    renderEmergency(c);
  }
  announce((isConfirm ? "Gate confirmed: " : "Override: ") + POLICY_LABELS[policyKey]);
  toast((isConfirm ? "Confirmed: " : "Override logged: ") + POLICY_LABELS[policyKey]);
}

/* ---------------- load + reset ---------------- */

function loadCase(id) {
  const c = DATA.cases.find((x) => x.id === id);
  if (!c) return;
  currentCase = c;
  currentPolicy = null;
  renderCases();
  renderMember(c);
  renderChat(c);
  renderPolicy(c);
  renderGate(c);
  els.gateStatus.classList.add("hidden");
  els.impactBlock.classList.add("hidden");
  els.emergencyBlock.classList.add("hidden");
  announce("Loaded synthetic chat for " + c.member.name + ": " + c.name);
}

function resetDemo() {
  loadCase(DATA.cases[0].id);
  toast("Demo reset");
}

/* ---------------- boot ---------------- */

fetch("data.json")
  .then((r) => r.json())
  .then((data) => {
    DATA = data;
    loadCase(DATA.cases[0].id);
  })
  .catch(() => {
    els.caseGrid.appendChild(
      el("p", "case-meta", "Failed to load synthetic data. Reopen the demo from a web server.")
    );
  });

els.reset.addEventListener("click", resetDemo);