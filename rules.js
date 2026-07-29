/* ============================================================
   rules.js
   The knowledge base. Every rule is an explicit IF/THEN pair:
   `test(facts)` is the condition, `advice(facts)` produces the
   recommendation text, `explain(facts)` produces the reasoning
   trace shown to the student ("why was I told this?").
   Grouped into the four advisory categories from the design.
   ============================================================ */

const RULE_CATEGORY = {
  STANDING: 'Academic Standing',
  SPECIALIZATION: 'Specialization Guidance',
  CLINICAL: 'Clinical Readiness',
  GRADUATION: 'Graduation Pathway'
};

const RULES = [

  /* ---------------- Academic Standing ---------------- */
  {
    id: 'AS-01',
    category: RULE_CATEGORY.STANDING,
    severity: 'critical',
    description: 'IF CGPA < 2.00 THEN flag academic-probation risk.',
    test: f => f.cgpa < 2.00,
    advice: () => 'Academic probation risk. Prioritize retaking failed core courses before your next registration.',
    explain: f => `Your CGPA is ${f.cgpa.toFixed(2)}, below the 2.00 good-standing threshold.`,
    cf: f => certainty((2.00 - f.cgpa) * 4)
  },
  {
    id: 'AS-02',
    category: RULE_CATEGORY.STANDING,
    severity: 'warning',
    description: 'IF 2.00 \u2264 CGPA < 2.50 THEN recommend reduced elective load.',
    test: f => f.cgpa >= 2.00 && f.cgpa < 2.50,
    advice: () => 'Below comfortable standing. Consider reducing elective load next semester and focusing on core courses.',
    explain: f => `Your CGPA is ${f.cgpa.toFixed(2)}, in the 2.00\u20132.49 caution band.`,
    cf: f => certainty((0.25 - Math.abs(f.cgpa - 2.25)) * 4)
  },
  {
    id: 'AS-03',
    category: RULE_CATEGORY.STANDING,
    severity: 'critical',
    description: 'IF any core course has grade F THEN flag for mandatory retake.',
    test: f => f.failedCore.length > 0,
    advice: f => `Retake required: ${f.failedCore.map(c => c.code).join(', ')} must be repeated before dependent courses can be taken.`,
    explain: f => `You have an F grade in ${f.failedCore.length} core course(s): ${f.failedCore.map(c => c.title).join('; ')}.`,
    cf: f => factCertainty(f.failedCore.length)
  },
  {
    id: 'AS-04',
    category: RULE_CATEGORY.STANDING,
    severity: 'positive',
    description: 'IF CGPA \u2265 4.50 THEN flag for distinction-track opportunities.',
    test: f => f.cgpa >= 4.50,
    advice: () => 'First Class trajectory. You are eligible to be considered for research assistantship and academic distinction opportunities.',
    explain: f => `Your CGPA of ${f.cgpa.toFixed(2)} is at or above the 4.50 distinction band.`,
    cf: f => certainty((f.cgpa - 4.50) * 4)
  },

  /* ---------------- Specialization Guidance ---------------- */
  {
    id: 'SG-01',
    category: RULE_CATEGORY.SPECIALIZATION,
    severity: 'info',
    description: 'IF avg grade in Maternal & Child Health \u2265 B (with \u2265 2 courses taken) THEN suggest Midwifery / Pediatric track.',
    test: f => f.catAvg.MATERNAL != null && f.catAvg.MATERNAL >= 4.0 && f.catCount.MATERNAL >= 2,
    advice: () => 'Strong performance in Maternal & Child Health. Worth exploring a Midwifery / Pediatric Nursing specialization track.',
    explain: f => `Your average grade point in Maternal & Child Health courses is ${f.catAvg.MATERNAL.toFixed(2)}/5.0 across ${f.catCount.MATERNAL} course(s).`,
    cf: f => certainty((f.catAvg.MATERNAL - 4.0) * 3 + (f.catCount.MATERNAL - 2) * 0.3)
  },
  {
    id: 'SG-02',
    category: RULE_CATEGORY.SPECIALIZATION,
    severity: 'info',
    description: 'IF avg grade in Mental Health Nursing \u2265 B THEN suggest Psychiatric/Mental Health track.',
    test: f => f.catAvg.MENTAL != null && f.catAvg.MENTAL >= 4.0 && f.catCount.MENTAL >= 1,
    advice: () => 'Strong performance in Mental Health Nursing. Worth exploring a Psychiatric / Mental Health Nursing specialization track.',
    explain: f => `Your average grade point in Mental Health Nursing courses is ${f.catAvg.MENTAL.toFixed(2)}/5.0 across ${f.catCount.MENTAL} course(s).`,
    cf: f => certainty((f.catAvg.MENTAL - 4.0) * 3 + (f.catCount.MENTAL - 1) * 0.3)
  },
  {
    id: 'SG-03',
    category: RULE_CATEGORY.SPECIALIZATION,
    severity: 'info',
    description: 'IF avg grade in Community Health \u2265 B THEN suggest Public/Community Health track.',
    test: f => f.catAvg.COMMUNITY != null && f.catAvg.COMMUNITY >= 4.0 && f.catCount.COMMUNITY >= 1,
    advice: () => 'Strong performance in Community Health Nursing. Worth exploring a Public / Community Health Nursing specialization track.',
    explain: f => `Your average grade point in Community Health courses is ${f.catAvg.COMMUNITY.toFixed(2)}/5.0 across ${f.catCount.COMMUNITY} course(s).`,
    cf: f => certainty((f.catAvg.COMMUNITY - 4.0) * 3 + (f.catCount.COMMUNITY - 1) * 0.3)
  },
  {
    id: 'SG-04',
    category: RULE_CATEGORY.SPECIALIZATION,
    severity: 'info',
    description: 'IF avg grade in Medical-Surgical \u2265 B THEN suggest Med-Surg / Critical Care track.',
    test: f => f.catAvg.MEDSURG != null && f.catAvg.MEDSURG >= 4.0 && f.catCount.MEDSURG >= 1,
    advice: () => 'Strong performance in Medical-Surgical Nursing. Worth exploring a Medical-Surgical / Critical Care Nursing specialization track.',
    explain: f => `Your average grade point in Medical-Surgical courses is ${f.catAvg.MEDSURG.toFixed(2)}/5.0 across ${f.catCount.MEDSURG} course(s).`,
    cf: f => certainty((f.catAvg.MEDSURG - 4.0) * 3 + (f.catCount.MEDSURG - 1) * 0.3)
  },

  /* ---------------- Clinical Readiness ---------------- */
  {
    id: 'CR-01',
    category: RULE_CATEGORY.CLINICAL,
    severity: 'critical',
    description: 'IF level \u2265 300 AND CGPA < 2.00 THEN block clinical placement eligibility.',
    test: f => f.level >= 300 && f.cgpa < 2.00,
    advice: () => 'Not eligible for clinical practicum placement until CGPA reaches the 2.00 minimum.',
    explain: f => `You are at ${f.level} level with a CGPA of ${f.cgpa.toFixed(2)}, below the 2.00 clinical-eligibility floor.`,
    cf: f => certainty((2.00 - f.cgpa) * 4)
  },
  {
    id: 'CR-02',
    category: RULE_CATEGORY.CLINICAL,
    severity: 'critical',
    description: 'IF any clinical-practicum prerequisite course is missing or failed THEN block that placement.',
    test: f => f.blockedClinical.length > 0,
    advice: f => `Clinical placement blocked for: ${f.blockedClinical.map(c => c.title).join(', ')}. Prerequisite not yet passed.`,
    explain: f => `${f.blockedClinical.length} clinical practicum course(s) have an unmet or failed prerequisite.`,
    cf: f => factCertainty(f.blockedClinical.length)
  },
  {
    id: 'CR-03',
    category: RULE_CATEGORY.CLINICAL,
    severity: 'positive',
    description: 'IF all 100-level core courses passed AND CGPA \u2265 2.00 THEN confirm general clinical eligibility.',
    test: f => f.foundationCleared && f.cgpa >= 2.00,
    advice: () => 'Foundational requirements cleared. You meet the general eligibility bar for clinical practicum placement.',
    explain: f => `All 100-level core courses are passed and your CGPA (${f.cgpa.toFixed(2)}) meets the 2.00 minimum.`,
    cf: f => certainty((f.cgpa - 2.00) * 2 + 0.5)
  },

  /* ---------------- Graduation Pathway ---------------- */
  {
    id: 'GP-01',
    category: RULE_CATEGORY.GRADUATION,
    severity: 'warning',
    description: 'IF completed credit units < expected units for level THEN flag off-track.',
    test: f => f.unitsCompleted < f.expectedUnits,
    advice: f => `Off track for on-time graduation by ${f.expectedUnits - f.unitsCompleted} credit unit(s). Consider makeup/summer registration.`,
    explain: f => `You have completed ${f.unitsCompleted} of an expected ${f.expectedUnits} cumulative credit units for ${f.level} level.`,
    cf: f => certainty((f.expectedUnits - f.unitsCompleted) * 0.35)
  },
  {
    id: 'GP-02',
    category: RULE_CATEGORY.GRADUATION,
    severity: 'positive',
    description: 'IF completed units \u2265 expected AND CGPA \u2265 2.00 THEN confirm on-track status.',
    test: f => f.unitsCompleted >= f.expectedUnits && f.cgpa >= 2.00,
    advice: () => 'On track for graduation at your expected semester.',
    explain: f => `Credit units (${f.unitsCompleted}/${f.expectedUnits} expected) and CGPA (${f.cgpa.toFixed(2)}) both meet the pathway requirement.`,
    cf: f => certainty((f.unitsCompleted - f.expectedUnits) * 0.2 + (f.cgpa - 2.00))
  },
  {
    id: 'GP-03',
    category: RULE_CATEGORY.GRADUATION,
    severity: 'critical',
    description: 'IF level = 500 AND outstanding core courses > 0 THEN flag defense-eligibility risk.',
    test: f => f.level === 500 && f.outstandingCore.length > 0,
    advice: f => `Final-year defense eligibility at risk: clear ${f.outstandingCore.map(c => c.code).join(', ')} before defense registration.`,
    explain: f => `${f.outstandingCore.length} core course(s) remain outstanding at 500 level.`,
    cf: f => factCertainty(f.outstandingCore.length)
  }
];
