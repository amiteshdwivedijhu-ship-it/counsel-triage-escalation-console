# Counsel · Triage Escalation Policy Console

Working prototype for the Senior Product Manager, Core Product seat at Counsel
Health: a triage escalation policy console that sits on the core chat. A
synthetic member chat turn loads with a Counsel AI triage recommendation
(cited symptom and history stubs), an operator confirms or overrides the
escalation policy at a human gate, and the care path updates: stay with
Counsel AI, add a doctor to chat, urgent redirect, or emergency guidance.

Walkthrough: load a case, read the chat and the cited policy, pick a gate,
read the care-path impact. All three paths are pre-recorded synthetic data.

## Honesty note

- Synthetic member data only. No real PHI, no accounts, no real doctor
  contact, no medical advice. The emergency panel is labeled as a synthetic
  demo.
- Styling is matched to Counsel's public marketing site (counselhealth.com),
  captured on 2026-09-30: mint accent, calm consumer-medical palette, "AI,
  then add a real doctor" vocabulary, $29 visit, doctors who see the full
  picture.
- The operator console surface is inferred. Public sources show the
  consumer chat marketing; a signed-in clinician or PM triage console is not
  publicly observable. No account was created and no product was signed into.

## Files

- `index.html` page shell, phone-first structure
- `styles.css` Counsel-styled mobile layout (375px, no horizontal scroll)
- `app.js` case loading, gate logic, impact rendering
- `data.json` three synthetic member chats with citations and impacts

Run locally with any static server: `python3 -m http.server`.