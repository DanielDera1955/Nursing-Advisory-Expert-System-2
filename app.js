/* ============================================================
   app.js — view routing + rendering. No framework: plain DOM.
   ============================================================ */

const ADMIN_PASSWORD = 'nursing-kb-2026'; // shared demo password, matches existing project pattern

let state = {
  student: JSON.parse(JSON.stringify(DEMO_STUDENT)),
  facts: null,
  results: null
};

const app = document.getElementById('app');

function render(){
  const route = location.hash.replace('#','') || 'landing';
  if (route === 'student') return renderStudentView();
  if (route === 'admin') return renderAdminGate();
  if (route === 'admin-kb') return renderAdminKB();
  return renderLanding();
}
window.addEventListener('hashchange', render);
document.addEventListener('DOMContentLoaded', render);

/* ---------------- Landing ---------------- */
function renderLanding(){
  app.innerHTML = `
    <div class="landing">
      <div class="landing-card">
        <div class="seal">CU</div>
        <div class="eyebrow">Expert System</div>
        <h1 class="title">Nursing Student Academic Advisory System</h1>
        <p class="subtitle">Design and Implementation of an Expert System for Student Use in the School of Nursing, Caritas University. A rule-based advisory engine for academic standing, specialization guidance, clinical readiness, and graduation pathway tracking.</p>
        <div class="role-choices">
          <div class="role-card">
            <h3>Student</h3>
            <p>Review your academic record and receive rule-based advisory guidance, with the reasoning behind every recommendation.</p>
            <button class="btn btn-teal btn-block" onclick="location.hash='student'">Enter as student</button>
          </div>
          <div class="role-card">
            <h3>Admin</h3>
            <p>View the system's knowledge base &mdash; every rule, its condition, and the advisory it produces.</p>
            <button class="btn btn-ghost btn-block" onclick="location.hash='admin'">View knowledge base</button>
          </div>
        </div>
      </div>
    </div>
    ${footer()}
  `;
}

/* ---------------- Student view ---------------- */
function renderStudentView(){
  const s = state.student;

  const rows = CURRICULUM.map(c => {
    const rec = s.records.find(r => r[0] === c.code);
    const grade = rec ? rec[1] : '';
    const tag = c.clinical ? '<span class="tag clinical">clinical</span>' : `<span class="tag">${c.category.split(' ')[0]}</span>`;
    return `
      <tr>
        <td class="code-cell" data-label="Code">${c.code}</td>
        <td data-label="Course">
          <div>${c.title}</div>
          <div class="course-title">${c.level}L &middot; Sem ${c.semester} &middot; ${c.units} units &middot; ${tag}</div>
        </td>
        <td data-label="Grade">
          <select class="grade-select" data-code="${c.code}" onchange="onGradeChange(this)">
            <option value="">&mdash;</option>
            ${['A','B','C','D','E','F'].map(g => `<option value="${g}" ${g===grade?'selected':''}>${g}</option>`).join('')}
          </select>
        </td>
      </tr>`;
  }).join('');

  app.innerHTML = `
    ${topbar('Student', s.name)}
    <div class="view">
      <div class="student-header">
        <div class="student-id">
          <h1>${s.name}</h1>
          <div class="regno">${s.regNumber} &middot; Level
            <select id="levelSelect" onchange="onLevelChange(this)" style="font-family:var(--mono);border:1px solid var(--card-border-strong);border-radius:5px;padding:2px 4px;background:var(--bg-raised);color:var(--text);">
              ${[100,200,300,400,500].map(l => `<option value="${l}" ${l===s.level?'selected':''}>${l}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div id="vitalsWrap"></div>

      <div class="section-head">
        <h2>Academic Record</h2>
        <span class="meta">${CURRICULUM.length} courses in curriculum</span>
      </div>
      <div class="record-table-wrap">
        <table class="records">
          <thead><tr><th>Code</th><th>Course</th><th>Grade</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="run-bar">
        <button class="btn btn-ghost" onclick="resetDemo()">Reset to demo record</button>
        <button class="btn btn-primary" onclick="runAdvisory()">Run advisory analysis</button>
      </div>

      <div id="resultsWrap"></div>
    </div>
    ${footer()}
  `;

  computeAndRenderVitals();
  if (state.results) renderResults();
}

function onGradeChange(sel){
  const code = sel.dataset.code;
  const grade = sel.value;
  const existing = state.student.records.find(r => r[0] === code);
  if (grade === ''){
    state.student.records = state.student.records.filter(r => r[0] !== code);
  } else if (existing){
    existing[1] = grade;
  } else {
    state.student.records.push([code, grade]);
  }
  computeAndRenderVitals();
  state.results = null;
  document.getElementById('resultsWrap').innerHTML = '';
}

function onLevelChange(sel){
  state.student.level = Number(sel.value);
  computeAndRenderVitals();
}

function resetDemo(){
  state.student = JSON.parse(JSON.stringify(DEMO_STUDENT));
  state.results = null;
  renderStudentView();
}

function computeAndRenderVitals(){
  const facts = deriveFacts(state.student);
  state.facts = facts;
  const cgpaClass = facts.cgpa < 2.0 ? 'alert' : facts.cgpa >= 4.0 ? 'good' : '';
  const unitsClass = facts.unitsCompleted < facts.expectedUnits ? 'amber' : 'good';
  document.getElementById('vitalsWrap').innerHTML = `
    <div class="vitals">
      <div class="vitals-row">
        <div class="vital">
          <div class="label">CGPA</div>
          <div class="value ${cgpaClass}">${facts.cgpa.toFixed(2)}</div>
        </div>
        <div class="vital">
          <div class="label">Credit Units</div>
          <div class="value ${unitsClass}">${facts.unitsCompleted}<span style="font-size:13px;color:var(--text-soft);">/${facts.expectedUnits}</span></div>
        </div>
        <div class="vital">
          <div class="label">Core Outstanding</div>
          <div class="value ${facts.outstandingCore.length ? 'alert':'good'}">${facts.outstandingCore.length}</div>
        </div>
        <div class="vital">
          <div class="label">Clinical Blocks</div>
          <div class="value ${facts.blockedClinical.length ? 'amber':'good'}">${facts.blockedClinical.length}</div>
        </div>
      </div>
      <div class="vitals-trace">${vitalsTraceSVG(facts)}</div>
    </div>
  `;
}

// Signature element: a vitals-monitor-style trace, repurposed to show
// per-semester grade-point trend instead of a heart rate.
function vitalsTraceSVG(facts){
  const byCode = Object.fromEntries(CURRICULUM.map(c => [c.code, c]));
  const takenSorted = facts.taken
    .slice()
    .sort((a,b) => a.level - b.level || a.semester - b.semester);
  if (takenSorted.length < 2){
    return `<svg viewBox="0 0 600 40" width="100%" height="40" preserveAspectRatio="none"><line x1="0" y1="20" x2="600" y2="20" stroke="var(--card-border-strong)" stroke-width="1"/></svg>`;
  }
  // group by level+semester, average grade point
  const groups = {};
  takenSorted.forEach(r => {
    const key = `${r.level}-${r.semester}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r.point);
  });
  const keys = Object.keys(groups);
  const values = keys.map(k => groups[k].reduce((a,b)=>a+b,0)/groups[k].length);
  const w = 600, h = 40, pad = 4;
  const stepX = keys.length > 1 ? (w - pad*2) / (keys.length - 1) : 0;
  const points = values.map((v,i) => {
    const x = pad + i*stepX;
    const y = h - pad - (v/5)*(h - pad*2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = 'M ' + points.join(' L ');
  const dots = points.map(p => {
    const [x,y] = p.split(',');
    return `<circle cx="${x}" cy="${y}" r="2.5" fill="var(--teal)"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="40" preserveAspectRatio="none">
    <polyline points="${points.join(' ')}" fill="none" stroke="var(--teal)" stroke-width="1.6"/>
    ${dots}
  </svg>`;
}

function runAdvisory(){
  const facts = deriveFacts(state.student);
  state.facts = facts;
  state.results = runInference(facts);
  renderResults();
  document.getElementById('resultsWrap').scrollIntoView({behavior:'smooth', block:'start'});
}

function renderResults(){
  const results = state.results;
  const wrap = document.getElementById('resultsWrap');
  if (!results){ wrap.innerHTML = ''; return; }

  if (results.length === 0){
    wrap.innerHTML = `
      <div class="section-head"><h2>Advisory Results</h2></div>
      <p class="empty-note">No rules fired for the current record — no flags, no guidance triggered at this time.</p>`;
    return;
  }

  const byCat = {};
  results.forEach(r => { (byCat[r.category] = byCat[r.category] || []).push(r); });

  const sections = Object.entries(byCat).map(([cat, items]) => `
    <div class="section-head"><h2>${cat}</h2><span class="meta">${items.length} rule(s) fired</span></div>
    <div class="advisory-grid">
      ${items.map(r => `
        <div class="advisory-card severity-${r.severity}">
          <div class="advisory-top">
            <div>
              <div class="advisory-cat">${r.severity}</div>
              <p class="advisory-text">${r.advice}</p>
            </div>
            <span class="rule-chip">${r.id}</span>
          </div>
          <button class="explain-toggle" onclick="toggleExplain(this)">Why am I seeing this?</button>
          <div class="explain-box hidden">${r.explanation}</div>
        </div>
      `).join('')}
    </div>
  `).join('');

  wrap.innerHTML = sections;
}

function toggleExplain(btn){
  const box = btn.nextElementSibling;
  box.classList.toggle('hidden');
}

/* ---------------- Admin: password gate ---------------- */
function renderAdminGate(){
  app.innerHTML = `
    ${topbar('Admin', null)}
    <div class="view view-narrow">
      <div class="section-head"><h2>Admin Access</h2></div>
      <p class="subtitle" style="margin:0 0 18px;text-align:left;">Enter the demo admin password to view the knowledge base.</p>
      <div class="access-field">
        <input type="password" id="adminPw" placeholder="Password" onkeydown="if(event.key==='Enter') checkAdminPw()"/>
        <button class="btn btn-primary btn-block" onclick="checkAdminPw()">View knowledge base</button>
        <div class="error-text" id="pwError"></div>
        <div class="hint">Demo password: ${ADMIN_PASSWORD}</div>
      </div>
    </div>
    ${footer()}
  `;
}

function checkAdminPw(){
  const val = document.getElementById('adminPw').value;
  if (val === ADMIN_PASSWORD){
    location.hash = 'admin-kb';
  } else {
    document.getElementById('pwError').textContent = 'Incorrect password.';
  }
}

/* ---------------- Admin: knowledge base viewer ---------------- */
function renderAdminKB(){
  const byCat = {};
  RULES.forEach(r => { (byCat[r.category] = byCat[r.category] || []).push(r); });

  const catBlocks = Object.entries(byCat).map(([cat, rules]) => `
    <div class="kb-cat">
      <h3>${cat}</h3>
      ${rules.map(r => `
        <div class="kb-rule">
          <div class="kb-rule-top"><span>${r.id}</span><span>${r.severity}</span></div>
          <div class="kb-rule-desc">${r.description}</div>
        </div>
      `).join('')}
    </div>
  `).join('');

  app.innerHTML = `
    ${topbar('Admin', 'Knowledge base')}
    <div class="view">
      <div class="section-head"><h2>Knowledge Base</h2><span class="meta">${RULES.length} rules &middot; ${Object.keys(byCat).length} categories</span></div>
      <div class="kb-stats">
        <div class="kb-stat"><div class="n">${RULES.length}</div><div class="l">Total Rules</div></div>
        <div class="kb-stat"><div class="n">${Object.keys(byCat).length}</div><div class="l">Categories</div></div>
        <div class="kb-stat"><div class="n">${CURRICULUM.length}</div><div class="l">Courses in Curriculum</div></div>
      </div>
      ${catBlocks}
    </div>
    ${footer()}
  `;
}

/* ---------------- Shared chrome ---------------- */
function topbar(roleLabel, sub){
  return `
    <div class="topbar">
      <div class="brand">
        <span class="brand-mark">CU</span>
        <span class="brand-name">Nursing Advisory</span>
        ${sub ? `<span class="brand-sub">${sub}</span>` : ''}
      </div>
      <div class="topbar-right">
        <span class="who">${roleLabel}</span>
        <button class="linklike" onclick="location.hash=''">Exit</button>
      </div>
    </div>
  `;
}

function footer(){
  return `<footer class="site-footer">Design and Implementation of an Expert System for Student Use in the School of Nursing &middot; Caritas University</footer>`;
}
