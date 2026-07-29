/* ============================================================
   engine.js
   Three jobs:
     1. deriveFacts(student)  — turn a raw academic record into
        the structured "facts" the rules reason over.
     2. certainty(margin, sensitivity) — shared helper that turns
        "how far past a threshold" into a bounded confidence score.
        Never returns 0 or 1: an expert system should not claim
        absolute certainty from incomplete input data (the same
        principle behind MYCIN's certainty-factor model).
     3. runInference(facts)   — forward-chain: test every rule
        against the facts, collect the ones that fire, each with
        its own certainty factor and explanation trace.
   ============================================================ */

// margin: how far past its own threshold a fact sits, in whatever
// unit that rule works in (grade points, credit units, etc).
// sensitivity: how quickly confidence should rise with margin.
// Bounded to [0.55, 0.97] — a fired rule is never "0% sure" (it
// fired) and never claimed "100% sure" (no rule-based system
// should overclaim against a small, possibly incomplete record).
function certainty(margin, sensitivity = 1) {
  const raw = 1 / (1 + Math.exp(-sensitivity * margin));
  return Math.min(0.97, Math.max(0.55, 0.55 + raw * 0.42));
}

// For rules that fire on a plain fact match (an F grade exists, a
// prerequisite is missing) rather than a graded threshold — high
// confidence since it's a direct data match, nudged slightly by
// how many instances support it, still capped below certainty.
function factCertainty(instanceCount = 1) {
  return Math.min(0.97, 0.90 + instanceCount * 0.02);
}

function deriveFacts(student) {
  const byCode = Object.fromEntries(CURRICULUM.map(c => [c.code, c]));
  const taken = student.records
    .map(([code, grade]) => ({ ...byCode[code], grade, point: GRADE_POINTS[grade] }))
    .filter(r => r.code); // ignore unknown codes defensively

  // --- CGPA ---
  const totalUnits = taken.reduce((s, r) => s + r.units, 0);
  const totalPoints = taken.reduce((s, r) => s + r.point * r.units, 0);
  const cgpa = totalUnits > 0 ? totalPoints / totalUnits : 0;

  // --- failed core courses ---
  const failedCore = taken.filter(r => r.core && r.grade === 'F');

  // --- category averages (for specialization guidance) ---
  const catKeys = Object.keys(CATEGORY); // FOUNDATION, MATERNAL, MENTAL, COMMUNITY, MEDSURG, RESEARCH
  const catAvg = {}, catCount = {};
  catKeys.forEach(key => {
    const label = CATEGORY[key];
    const rows = taken.filter(r => r.category === label);
    catCount[key] = rows.length;
    catAvg[key] = rows.length ? rows.reduce((s, r) => s + r.point, 0) / rows.length : null;
  });

  // --- clinical readiness ---
  const takenCodes = new Set(taken.map(r => r.code));
  const takenMap = Object.fromEntries(taken.map(r => [r.code, r]));
  const clinicalCourses = CURRICULUM.filter(c => c.clinical);
  const blockedClinical = clinicalCourses.filter(c => {
    const rec = takenMap[c.code];
    return !rec || rec.grade === 'F';
  }).filter(c => c.level <= student.level); // only ones relevant to where the student is now

  const level100Core = CURRICULUM.filter(c => c.level === 100 && c.core);
  const foundationCleared = level100Core.every(c => takenMap[c.code] && takenMap[c.code].grade !== 'F');

  // --- graduation pathway ---
  const unitsCompleted = totalUnits;
  const expectedUnits = EXPECTED_UNITS_BY_LEVEL[student.level] || TOTAL_CREDIT_UNITS;
  const coreUpToLevel = CURRICULUM.filter(c => c.core && c.level <= student.level);
  const outstandingCore = coreUpToLevel.filter(c => !takenCodes.has(c.code) || takenMap[c.code].grade === 'F');

  // --- degree audit: courses due so far, split into passed vs remaining ---
  const dueSoFar = CURRICULUM.filter(c => c.level <= student.level);
  const completedCourses = dueSoFar.filter(c => takenMap[c.code] && takenMap[c.code].grade !== 'F');
  const remainingCourses = dueSoFar.filter(c => !completedCourses.includes(c));
  const auditPct = dueSoFar.length ? Math.round((completedCourses.length / dueSoFar.length) * 100) : 0;

  // --- graduation readiness: one simple score blended from four factors
  // already computed above. Equal weight, no new inputs — a summary
  // view of facts the rules already reason over, not a new source of truth.
  const academicPct = coreUpToLevel.length
    ? Math.round(((coreUpToLevel.length - outstandingCore.length) / coreUpToLevel.length) * 100)
    : 100;
  const creditPct = Math.min(100, Math.round((unitsCompleted / expectedUnits) * 100));
  const cgpaPct = Math.min(100, Math.round((cgpa / 2.00) * 100));
  const relevantClinical = clinicalCourses.filter(c => c.level <= student.level);
  const clinicalPct = relevantClinical.length
    ? Math.round(((relevantClinical.length - blockedClinical.length) / relevantClinical.length) * 100)
    : 100;
  const readiness = {
    academicPct, creditPct, cgpaPct, clinicalPct,
    overall: Math.round((academicPct + creditPct + cgpaPct + clinicalPct) / 4)
  };

  return {
    name: student.name,
    regNumber: student.regNumber,
    level: student.level,
    cgpa,
    failedCore,
    catAvg,
    catCount,
    blockedClinical,
    foundationCleared,
    unitsCompleted,
    expectedUnits,
    outstandingCore,
    completedCourses,
    remainingCourses,
    auditPct,
    readiness,
    taken
  };
}

function runInference(facts, rules = RULES) {
  return rules
    .filter(rule => rule.test(facts))
    .map(rule => ({
      id: rule.id,
      category: rule.category,
      severity: rule.severity,
      advice: rule.advice(facts),
      explanation: rule.explain(facts),
      certainty: Math.round(rule.cf(facts) * 100)
    }));
}
