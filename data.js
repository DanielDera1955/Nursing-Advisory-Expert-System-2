/* ============================================================
   data.js
   Sample nursing curriculum + demo student record.
   NOTE: Course list is a representative B.NSc curriculum built
   for system demonstration purposes, not a reproduction of any
   institution's official course catalogue.
   ============================================================ */

// Course categories used by the specialization-guidance rules
const CATEGORY = {
  FOUNDATION: 'Foundational Science',
  MATERNAL: 'Maternal & Child Health',
  MENTAL: 'Mental Health Nursing',
  COMMUNITY: 'Community Health Nursing',
  MEDSURG: 'Medical-Surgical Nursing',
  RESEARCH: 'Research & Project'
};

// grade -> point (5.0 scale)
const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

const CURRICULUM = [
  // ---- 100 Level ----
  { code: 'NUR101', title: 'Anatomy I', level: 100, semester: 1, units: 3, category: CATEGORY.FOUNDATION, core: true },
  { code: 'NUR102', title: 'Physiology I', level: 100, semester: 1, units: 3, category: CATEGORY.FOUNDATION, core: true },
  { code: 'NUR103', title: 'Introduction to Nursing', level: 100, semester: 1, units: 2, category: CATEGORY.FOUNDATION, core: true },
  { code: 'GST101', title: 'Communication in English', level: 100, semester: 1, units: 2, category: CATEGORY.FOUNDATION, core: false },
  { code: 'NUR104', title: 'Anatomy II', level: 100, semester: 2, units: 3, category: CATEGORY.FOUNDATION, core: true },
  { code: 'NUR105', title: 'Physiology II', level: 100, semester: 2, units: 3, category: CATEGORY.FOUNDATION, core: true },
  { code: 'NUR106', title: 'Nursing Ethics & Jurisprudence', level: 100, semester: 2, units: 2, category: CATEGORY.FOUNDATION, core: true },

  // ---- 200 Level ----
  { code: 'NUR201', title: 'Fundamentals of Nursing I', level: 200, semester: 1, units: 3, category: CATEGORY.FOUNDATION, core: true },
  { code: 'NUR202', title: 'Pharmacology I', level: 200, semester: 1, units: 2, category: CATEGORY.MEDSURG, core: true },
  { code: 'NUR203', title: 'Community Health Nursing I', level: 200, semester: 1, units: 3, category: CATEGORY.COMMUNITY, core: true },
  { code: 'NUR204', title: 'Fundamentals of Nursing II', level: 200, semester: 2, units: 3, category: CATEGORY.FOUNDATION, core: true },
  { code: 'NUR205', title: 'Pharmacology II', level: 200, semester: 2, units: 2, category: CATEGORY.MEDSURG, core: true },
  { code: 'NUR206', title: 'Community Health Nursing II', level: 200, semester: 2, units: 3, category: CATEGORY.COMMUNITY, core: true },

  // ---- 300 Level ----
  { code: 'NUR301', title: 'Medical-Surgical Nursing I', level: 300, semester: 1, units: 4, category: CATEGORY.MEDSURG, core: true },
  { code: 'NUR302', title: 'Maternal & Child Health Nursing I', level: 300, semester: 1, units: 3, category: CATEGORY.MATERNAL, core: true },
  { code: 'NUR303', title: 'Mental Health Nursing I', level: 300, semester: 1, units: 3, category: CATEGORY.MENTAL, core: true },
  { code: 'NUR304', title: 'Medical-Surgical Nursing II', level: 300, semester: 2, units: 4, category: CATEGORY.MEDSURG, core: true },
  { code: 'NUR305', title: 'Maternal & Child Health Nursing II', level: 300, semester: 2, units: 3, category: CATEGORY.MATERNAL, core: true },
  { code: 'NUR306', title: 'Mental Health Nursing II', level: 300, semester: 2, units: 3, category: CATEGORY.MENTAL, core: true },

  // ---- 400 Level (clinical practicum prerequisites) ----
  { code: 'NUR401', title: 'Clinical Practicum: Medical-Surgical', level: 400, semester: 1, units: 4, category: CATEGORY.MEDSURG, core: true, clinical: true },
  { code: 'NUR402', title: 'Clinical Practicum: Maternal & Child', level: 400, semester: 1, units: 4, category: CATEGORY.MATERNAL, core: true, clinical: true },
  { code: 'NUR403', title: 'Nursing Research Methods', level: 400, semester: 1, units: 2, category: CATEGORY.RESEARCH, core: true },
  { code: 'NUR404', title: 'Clinical Practicum: Mental Health', level: 400, semester: 2, units: 4, category: CATEGORY.MENTAL, core: true, clinical: true },
  { code: 'NUR405', title: 'Clinical Practicum: Community Health', level: 400, semester: 2, units: 4, category: CATEGORY.COMMUNITY, core: true, clinical: true },
  { code: 'NUR406', title: 'Biostatistics', level: 400, semester: 2, units: 2, category: CATEGORY.RESEARCH, core: false },

  // ---- 500 Level ----
  { code: 'NUR501', title: 'Advanced Medical-Surgical Nursing', level: 500, semester: 1, units: 3, category: CATEGORY.MEDSURG, core: true },
  { code: 'NUR502', title: 'Nursing Management & Leadership', level: 500, semester: 1, units: 3, category: CATEGORY.FOUNDATION, core: true },
  { code: 'NUR503', title: 'Research Project I', level: 500, semester: 1, units: 3, category: CATEGORY.RESEARCH, core: true },
  { code: 'NUR504', title: 'Public Health Nursing', level: 500, semester: 2, units: 3, category: CATEGORY.COMMUNITY, core: true },
  { code: 'NUR505', title: 'Research Project II', level: 500, semester: 2, units: 3, category: CATEGORY.RESEARCH, core: true }
];

const TOTAL_CREDIT_UNITS = CURRICULUM.reduce((s, c) => s + c.units, 0);

// Expected cumulative credit units by the end of each level (used by
// the graduation-pathway rules to detect whether a student is on track).
const EXPECTED_UNITS_BY_LEVEL = (() => {
  const levels = [100, 200, 300, 400, 500];
  const map = {};
  let running = 0;
  levels.forEach(lv => {
    running += CURRICULUM.filter(c => c.level === lv).reduce((s, c) => s + c.units, 0);
    map[lv] = running;
  });
  return map;
})();

// A demo academic record so the panel can see the system run without
// needing to key in a full transcript live. Fully editable in the UI.
const DEMO_STUDENT = {
  name: 'Demo Student',
  regNumber: 'NUR/2022/0000',
  level: 400,
  records: [
    ['NUR101', 'B'], ['NUR102', 'A'], ['NUR103', 'B'], ['GST101', 'C'],
    ['NUR104', 'A'], ['NUR105', 'B'], ['NUR106', 'B'],
    ['NUR201', 'B'], ['NUR202', 'C'], ['NUR203', 'A'],
    ['NUR204', 'A'], ['NUR205', 'C'], ['NUR206', 'A'],
    ['NUR301', 'C'], ['NUR302', 'A'], ['NUR303', 'B'],
    ['NUR304', 'B'], ['NUR305', 'A'], ['NUR306', 'B'],
    ['NUR401', 'C'], ['NUR402', 'B'], ['NUR403', 'B']
  ]
};
