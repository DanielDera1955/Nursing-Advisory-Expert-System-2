# Nursing Student Academic Advisory Expert System

**Design and Implementation of an Expert System for Student Use in the School of Nursing, Caritas University**

Student: Okam Somto Chinagorom (CS/2022/1324)
Supervisor: Dr. Ugo Nwachukwu

## What this is

A rule-based expert system that takes a nursing student's academic record and produces
advisory guidance across four categories:

- **Academic Standing** — probation risk, retake priorities, distinction-track flags
- **Specialization Guidance** — suggests specialty tracks (Maternal & Child, Mental Health,
  Community Health, Medical-Surgical) based on category performance
- **Clinical Readiness** — checks CGPA and prerequisite completion for clinical practicum eligibility
- **Graduation Pathway** — tracks credit-unit accumulation against expected pace

Every recommendation comes with a "Why am I seeing this?" explanation trace, showing exactly
which rule fired and which facts triggered it — the explanation facility is what makes this a
genuine expert system rather than a plain conditional dashboard.

## Architecture

- `data.js` — sample curriculum (30 courses across 5 levels) and a demo student record
- `rules.js` — the knowledge base: 14 explicit IF/THEN rules across the four categories
- `engine.js` — the inference engine: derives structured facts from a raw record
  (`deriveFacts`), then forward-chains through the rule base (`runInference`)
- `app.js` — UI controller (plain DOM, no framework/build step)
- `style.css` — design system
- `index.html` — entry point

No backend, no database — matches the deployment pattern of the other Ancient Project builds.
All state lives in memory in the browser; the student's record is editable live in the table.

## Views

- **Student** (`#student`) — edit the academic record inline, run the advisory analysis,
  expand any result to see its reasoning trace
- **Admin** (`#admin` → password-gated → `#admin-kb`) — browse the full knowledge base,
  every rule's condition and category. Demo password is set in `app.js` (`ADMIN_PASSWORD`).

## Running locally

No build step. Open `index.html` directly in a browser, or serve the folder:

```
npx serve .
```

## Deploying

### GitHub
```
git init
git add .
git commit -m "Nursing student academic advisory expert system"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### Vercel
Import the GitHub repo at vercel.com/new — no configuration needed, it will auto-detect
this as a static site (no framework, no build command required).

## Before appendix screenshots

Set the demo student record and any on-screen labels to Okam's actual details before
capturing report screenshots — don't ship the generic "Demo Student" placeholder in the
final appendix.
