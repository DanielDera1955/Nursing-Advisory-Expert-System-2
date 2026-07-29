/* ============================================================
   engine.js
   Two jobs:
     1. deriveFacts(student)  — turn a raw academic record into
        the structured "facts" the rules reason over.
     2. runInference(facts)   — forward-chain: test every rule
        against the facts, collect the ones that fire, each with
        its own explanation trace.
   ============================================================ */

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
      explanation: rule.explain(facts)
    }));
}
