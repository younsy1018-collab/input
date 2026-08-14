/**
 * 기관 맞춤형 채용 평가 및 합격자 자동 결정 시스템 (app.js)
 * - 서류전형 & 면접전형 전항목 표준 5점 척도(5점:매우우수 ~ 1점:매우미흡) 원터치 선택 시스템
 * - 위원 전용 응시자 선택 콤보박스 및 참여/불참(결시) 처리 기능
 * - 평가위원 스마트폰 접속 QR 코드 실시간 생성 및 발급/출력 모달 연동
 * - 5점 척도 원점수(25점 만점) -> 100점 만점 자동 환산 연산 및 불참 과락 처리
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'INSTITUTION_RECRUITMENT_SYSTEM_V2';

  // Standard 5-Point Likert Scale Criteria for both Document & Interview Stages
  const defaultCriteria = {
    doc: [
      { id: 'dq1', name: '서류 적격성 및 자격요건', maxScore: 5, desc: '관련 전공, 경력 및 자격 보유 수준' },
      { id: 'dq2', name: '학업 성취 및 직무 적합성', maxScore: 5, desc: '직무 수행 능력 및 학업 경력 적합성' },
      { id: 'dq3', name: '자기소개서 및 직무수행계획', maxScore: 5, desc: '문장력, 논리성, 직무 이해도 및 목표' },
      { id: 'dq4', name: '직무 관련 우수성 및 자격증', maxScore: 5, desc: '전문 자격증 및 대외 활동 우수성' },
      { id: 'dq5', name: '발전가능성 및 조직적응력', maxScore: 5, desc: '인성, 사회봉사 및 팀워크 적응력' }
    ],
    interview: [
      { id: 'iq1', name: '공직자/직업인으로서의 정신자세', maxScore: 5, desc: '공직관, 직업윤리 및 성실한 태도' },
      { id: 'iq2', name: '전문지식과 그 응용능력', maxScore: 5, desc: '직무 관련 전문지식 및 활용 능력' },
      { id: 'iq3', name: '의사표현의 정확성과 논리성', maxScore: 5, desc: '논리적 의사전달 및 설득력' },
      { id: 'iq4', name: '예의·품행 및 성실성', maxScore: 5, desc: '예의범절, 태도 및 조직 적응력' },
      { id: 'iq5', name: '창의력·의지력 및 발전가능성', maxScore: 5, desc: '문제해결 의지 및 성장 잠재력' }
    ]
  };

  const defaultBonusRules = [
    { id: 'b1', name: '취업지원대상자 (보훈)', type: 'percent', value: 5, desc: '환산총점의 +5% 가산' },
    { id: 'b2', name: '장애인 대상자', type: 'percent', value: 3, desc: '환산총점의 +3% 가산' },
    { id: 'b3', name: '전문 자격증 보유자', type: 'score', value: 2.0, desc: '최종 가산점 +2.0점' }
  ];

  function buildDemoProject() {
    return {
      id: 'proj_2026_01',
      jobTitle: '2026년도 상반기 신입사원 채용 (일반행정)',
      docWeight: 30,
      interviewWeight: 70,
      passQuota: 3,
      waitQuota: 2,
      docCutoff: 60,
      interviewCutoff: 60,
      calcMethod: 'mean',
      docEvaluators: [
        { id: 'doc_ev1', name: '서류위원 A (내부)', role: '인사팀장' },
        { id: 'doc_ev2', name: '서류위원 B (외부)', role: '외부 인사전문가' }
      ],
      interviewEvaluators: [
        { id: 'int_ev1', name: '면접위원 1 (위원장)', role: '평가위원장' },
        { id: 'int_ev2', name: '면접위원 2 (내부)', role: '행정본부장' },
        { id: 'int_ev3', name: '면접위원 3 (외부)', role: '대학 교수' },
        { id: 'int_ev4', name: '면접위원 4 (외부)', role: '변호사' },
        { id: 'int_ev5', name: '면접위원 5 (외부)', role: '노무사' }
      ],
      docCriteria: JSON.parse(JSON.stringify(defaultCriteria.doc)),
      interviewCriteria: JSON.parse(JSON.stringify(defaultCriteria.interview)),
      bonusRules: JSON.parse(JSON.stringify(defaultBonusRules)),
      candidates: [
        { id: 'c01', candidateNo: 'A-2026-001', name: '홍길동', birth: '1996-03-15', phone: '010-1111-2222', bonusRuleId: 'b1' },
        { id: 'c02', candidateNo: 'A-2026-002', name: '이몽룡', birth: '1995-07-20', phone: '010-2222-3333', bonusRuleId: 'none' },
        { id: 'c03', candidateNo: 'A-2026-003', name: '성춘향', birth: '1997-11-05', phone: '010-3333-4444', bonusRuleId: 'b3' },
        { id: 'c04', candidateNo: 'A-2026-004', name: '임꺽정', birth: '1994-01-12', phone: '010-4444-5555', bonusRuleId: 'none' },
        { id: 'c05', candidateNo: 'A-2026-005', name: '신사임당', birth: '1998-04-25', phone: '010-5555-6666', bonusRuleId: 'b2' },
        { id: 'c06', candidateNo: 'A-2026-006', name: '세종대왕', birth: '1993-09-09', phone: '010-6666-7777', bonusRuleId: 'none' },
        { id: 'c07', candidateNo: 'A-2026-007', name: '이순신', birth: '1995-03-08', phone: '010-7777-8888', bonusRuleId: 'b1' },
        { id: 'c08', candidateNo: 'A-2026-008', name: '장영실', birth: '1996-12-30', phone: '010-8888-9999', bonusRuleId: 'none' },
        { id: 'c09', candidateNo: 'A-2026-009', name: '정약용', birth: '1997-02-14', phone: '010-9999-0000', bonusRuleId: 'none' },
        { id: 'c10', candidateNo: 'A-2026-010', name: '김유신', birth: '1994-10-10', phone: '010-1234-5678', bonusRuleId: 'none' }
      ],
      scores: {
        doc: {
          'doc_ev1': {
            'c01': { dq1: 5, dq2: 4, dq3: 5, dq4: 4, dq5: 4 },
            'c02': { dq1: 4, dq2: 4, dq3: 4, dq4: 3, dq5: 4 },
            'c03': { dq1: 5, dq2: 4, dq3: 5, dq4: 5, dq5: 4 },
            'c04': { dq1: 3, dq2: 4, dq3: 3, dq4: 3, dq5: 3 },
            'c05': { dq1: 5, dq2: 4, dq3: 4, dq4: 4, dq5: 4 },
            'c06': { dq1: 4, dq2: 4, dq3: 3, dq4: 4, dq5: 4 },
            'c07': { dq1: 5, dq2: 4, dq3: 4, dq4: 4, dq5: 4 },
            'c08': { dq1: 4, dq2: 3, dq3: 4, dq4: 3, dq5: 3 },
            'c09': { dq1: 3, dq2: 3, dq3: 3, dq4: 3, dq5: 3 },
            'c10': { dq1: 2, dq2: 2, dq3: 2, dq4: 3, dq5: 2 }
          },
          'doc_ev2': {
            'c01': { dq1: 5, dq2: 5, dq3: 4, dq4: 4, dq5: 4 },
            'c02': { dq1: 4, dq2: 4, dq3: 3, dq4: 4, dq5: 4 },
            'c03': { dq1: 5, dq2: 5, dq3: 4, dq4: 4, dq5: 5 },
            'c04': { dq1: 3, dq2: 3, dq3: 4, dq4: 3, dq5: 3 },
            'c05': { dq1: 5, dq2: 4, dq3: 4, dq4: 4, dq5: 4 },
            'c06': { dq1: 4, dq2: 3, dq3: 4, dq4: 4, dq5: 4 },
            'c07': { dq1: 5, dq2: 4, dq3: 4, dq4: 4, dq5: 4 },
            'c08': { dq1: 4, dq2: 4, dq3: 3, dq4: 3, dq5: 3 },
            'c09': { dq1: 3, dq2: 3, dq3: 3, dq4: 3, dq5: 3 },
            'c10': { dq1: 2, dq2: 3, dq3: 2, dq4: 2, dq5: 2 }
          }
        },
        interview: {
          'int_ev1': {
            'c01': { iq1: 5, iq2: 4, iq3: 5, iq4: 4, iq5: 4 },
            'c02': { iq1: 4, iq2: 4, iq3: 4, iq4: 4, iq5: 4 },
            'c03': { iq1: 5, iq2: 5, iq3: 5, iq4: 4, iq5: 5 },
            'c04': { iq1: 3, iq2: 4, iq3: 3, iq4: 4, iq5: 3 },
            'c05': { iq1: 4, iq2: 4, iq3: 4, iq4: 3, iq5: 4 },
            'c06': { iq1: 4, iq2: 4, iq3: 4, iq4: 4, iq5: 3 },
            'c07': { iq1: 5, iq2: 4, iq3: 5, iq4: 4, iq5: 4 },
            'c08': { iq1: 4, iq2: 3, iq3: 4, iq4: 3, iq5: 3 },
            'c09': { iq1: 2, iq2: 3, iq3: 2, iq4: 2, iq5: 2 },
            'c10': { iq1: 3, iq2: 3, iq3: 3, iq4: 4, iq5: 3 }
          },
          'int_ev2': {
            'c01': { iq1: 5, iq2: 5, iq3: 4, iq4: 4, iq5: 4 },
            'c02': { iq1: 4, iq2: 4, iq3: 4, iq4: 4, iq5: 3 },
            'c03': { iq1: 5, iq2: 4, iq3: 5, iq4: 5, iq5: 5 },
            'c04': { iq1: 4, iq2: 3, iq3: 4, iq4: 3, iq5: 3 },
            'c05': { iq1: 4, iq2: 4, iq3: 4, iq4: 4, iq5: 3 },
            'c06': { iq1: 4, iq2: 4, iq3: 3, iq4: 4, iq5: 4 },
            'c07': { iq1: 5, iq2: 4, iq3: 4, iq4: 5, iq5: 4 },
            'c08': { iq1: 4, iq2: 4, iq3: 3, iq4: 3, iq5: 3 },
            'c09': { iq1: 2, iq2: 2, iq3: 3, iq4: 2, iq5: 2 },
            'c10': { iq1: 3, iq2: 4, iq3: 3, iq4: 3, iq5: 3 }
          },
          'int_ev3': {
            'c01': { iq1: 5, iq2: 4, iq3: 5, iq4: 4, iq5: 4 },
            'c02': { iq1: 4, iq2: 4, iq3: 4, iq4: 4, iq5: 4 },
            'c03': { iq1: 5, iq2: 5, iq3: 5, iq4: 4, iq5: 5 },
            'c04': { iq1: 3, iq2: 4, iq3: 3, iq4: 4, iq5: 3 },
            'c05': { iq1: 4, iq2: 4, iq3: 4, iq4: 4, iq5: 3 },
            'c06': { iq1: 4, iq2: 4, iq3: 3, iq4: 4, iq5: 3 },
            'c07': { iq1: 5, iq2: 5, iq3: 4, iq4: 4, iq5: 4 },
            'c08': { iq1: 4, iq2: 3, iq3: 4, iq4: 3, iq5: 3 },
            'c09': { iq1: 2, iq2: 2, iq3: 2, iq4: 3, iq5: 2 },
            'c10': { iq1: 3, iq2: 3, iq3: 4, iq4: 3, iq5: 3 }
          },
          'int_ev4': {
            'c01': { iq1: 5, iq2: 4, iq3: 4, iq4: 5, iq5: 4 },
            'c02': { iq1: 4, iq2: 4, iq3: 4, iq4: 4, iq5: 3 },
            'c03': { iq1: 5, iq2: 5, iq3: 4, iq4: 5, iq5: 5 },
            'c04': { iq1: 4, iq2: 3, iq3: 3, iq4: 4, iq5: 3 },
            'c05': { iq1: 4, iq2: 4, iq3: 4, iq4: 4, iq5: 4 },
            'c06': { iq1: 4, iq2: 3, iq3: 4, iq4: 4, iq5: 3 },
            'c07': { iq1: 5, iq2: 4, iq3: 5, iq4: 4, iq5: 4 },
            'c08': { iq1: 4, iq2: 4, iq3: 3, iq4: 3, iq5: 3 },
            'c09': { iq1: 2, iq2: 3, iq3: 2, iq4: 2, iq5: 2 },
            'c10': { iq1: 3, iq2: 3, iq3: 3, iq4: 4, iq5: 3 }
          },
          'int_ev5': {
            'c01': { iq1: 5, iq2: 4, iq3: 5, iq4: 4, iq5: 4 },
            'c02': { iq1: 4, iq2: 4, iq3: 4, iq4: 4, iq5: 4 },
            'c03': { iq1: 5, iq2: 5, iq3: 5, iq4: 4, iq5: 5 },
            'c04': { iq1: 3, iq2: 4, iq3: 3, iq4: 4, iq5: 3 },
            'c05': { iq1: 4, iq2: 4, iq3: 4, iq4: 4, iq5: 3 },
            'c06': { iq1: 4, iq2: 4, iq3: 3, iq4: 4, iq5: 3 },
            'c07': { iq1: 5, iq2: 4, iq3: 5, iq4: 4, iq5: 4 },
            'c08': { iq1: 4, iq2: 3, iq3: 4, iq4: 3, iq5: 3 },
            'c09': { iq1: 2, iq2: 2, iq3: 2, iq4: 2, iq5: 2 },
            'c10': { iq1: 3, iq2: 4, iq3: 3, iq4: 3, iq5: 3 }
          }
        }
      }
    };
  }

  let state = {
    projects: [buildDemoProject()],
    activeProjectId: 'proj_2026_01',
    userMode: 'admin',
    activeTab: 'tab-settings',
    activeScoringStage: 'doc',
    activeScoringEvaluator: 'doc_ev1',
    activeSubtab: 'subtab-weighted'
  };

  function ensureProjectMigration(proj) {
    if (!proj) return buildDemoProject();

    if (!proj.docCriteria || proj.docCriteria.length === 0) {
      proj.docCriteria = JSON.parse(JSON.stringify(defaultCriteria.doc));
    } else {
      proj.docCriteria.forEach(c => { if (!c.maxScore) c.maxScore = 5; });
    }

    if (!proj.interviewCriteria || proj.interviewCriteria.length === 0) {
      proj.interviewCriteria = JSON.parse(JSON.stringify(defaultCriteria.interview));
    } else {
      proj.interviewCriteria.forEach(c => { if (!c.maxScore) c.maxScore = 5; });
    }

    if (!proj.bonusRules || proj.bonusRules.length === 0) {
      proj.bonusRules = JSON.parse(JSON.stringify(defaultBonusRules));
    }

    if (!proj.docEvaluators || proj.docEvaluators.length === 0) {
      proj.docEvaluators = [
        { id: 'doc_ev1', name: '서류위원 A (내부)', role: '인사팀장' },
        { id: 'doc_ev2', name: '서류위원 B (외부)', role: '외부 인사전문가' }
      ];
    }
    if (!proj.interviewEvaluators || proj.interviewEvaluators.length === 0) {
      proj.interviewEvaluators = [
        { id: 'int_ev1', name: '면접위원 1 (위원장)', role: '평가위원장' },
        { id: 'int_ev2', name: '면접위원 2 (내부)', role: '행정본부장' },
        { id: 'int_ev3', name: '면접위원 3 (외부)', role: '대학 교수' },
        { id: 'int_ev4', name: '면접위원 4 (외부)', role: '변호사' },
        { id: 'int_ev5', name: '면접위원 5 (외부)', role: '노무사' }
      ];
    }

    if (!proj.candidates || proj.candidates.length === 0) {
      proj.candidates = buildDemoProject().candidates;
    }

    if (!proj.scores) proj.scores = { doc: {}, interview: {} };
    if (!proj.scores.doc) proj.scores.doc = {};
    if (!proj.scores.interview) proj.scores.interview = {};

    return proj;
  }

  function getActiveProject() {
    let proj = state.projects.find(p => p.id === state.activeProjectId);
    if (!proj) {
      if (state.projects.length === 0) {
        state.projects.push(buildDemoProject());
      }
      state.activeProjectId = state.projects[0].id;
      proj = state.projects[0];
    }
    return ensureProjectMigration(proj);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        userMode: state.userMode
      }));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.projects && parsed.projects.length > 0) {
          state.projects = parsed.projects.map(ensureProjectMigration);
        }
        if (parsed.activeProjectId) state.activeProjectId = parsed.activeProjectId;
        if (parsed.userMode) state.userMode = parsed.userMode;
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
  }

  window.RecruitmentApp = {
    getActiveProject,
    saveState,
    loadState,
    defaultCriteria,
    EvaluationEngine: null
  };

  // ==========================================
  // 2. Evaluation Calculation Engine
  // ==========================================
  const EvaluationEngine = {
    getAttendance(stage, evaluatorId, candidateId) {
      const proj = getActiveProject();
      if (proj.scores &&
          proj.scores[stage] &&
          proj.scores[stage][evaluatorId] &&
          proj.scores[stage][evaluatorId][candidateId]) {
        return proj.scores[stage][evaluatorId][candidateId]._attendance || 'present';
      }
      return 'present';
    },

    setAttendance(stage, evaluatorId, candidateId, status) {
      const proj = getActiveProject();
      if (!proj.scores[stage]) proj.scores[stage] = {};
      if (!proj.scores[stage][evaluatorId]) proj.scores[stage][evaluatorId] = {};
      if (!proj.scores[stage][evaluatorId][candidateId]) proj.scores[stage][evaluatorId][candidateId] = {};

      proj.scores[stage][evaluatorId][candidateId]._attendance = status;
      saveState();
    },

    getScore(stage, evaluatorId, candidateId, critId) {
      const proj = getActiveProject();
      if (proj.scores &&
          proj.scores[stage] &&
          proj.scores[stage][evaluatorId] &&
          proj.scores[stage][evaluatorId][candidateId]) {
        const val = proj.scores[stage][evaluatorId][candidateId][critId];
        return val !== undefined && val !== null && val !== '' ? Number(val) : null;
      }
      return null;
    },

    getEvaluatorSum(stage, evaluatorId, candidateId) {
      const proj = getActiveProject();
      const criteria = (stage === 'doc' ? proj.docCriteria : proj.interviewCriteria) || defaultCriteria[stage];
      
      const attendance = this.getAttendance(stage, evaluatorId, candidateId);
      let maxPossibleRaw = criteria.reduce((sum, crit) => sum + (Number(crit.maxScore) || 5), 0);

      if (attendance === 'absent') {
        return {
          total: 0,
          rawTotal: 0,
          maxPossibleRaw,
          convertedTotal: 0,
          isComplete: true,
          isAbsent: true
        };
      }

      let rawTotal = 0;
      let isComplete = true;

      for (const crit of criteria) {
        const score = this.getScore(stage, evaluatorId, candidateId, crit.id);
        if (score === null || isNaN(score)) {
          isComplete = false;
        } else {
          rawTotal += score;
        }
      }

      let convertedTotal = 0;
      if (maxPossibleRaw > 0) {
        convertedTotal = Number(((rawTotal / maxPossibleRaw) * 100).toFixed(2));
      }

      return {
        total: convertedTotal,
        rawTotal,
        maxPossibleRaw,
        convertedTotal,
        isComplete,
        isAbsent: false
      };
    },

    getEvaluatorsForStage(stage) {
      const proj = getActiveProject();
      return stage === 'doc' ? proj.docEvaluators : proj.interviewEvaluators;
    },

    getStageAverage(stage, candidateId) {
      const evaluators = this.getEvaluatorsForStage(stage);
      if (!evaluators || evaluators.length === 0) return { avg: 0, isComplete: false, isAbsent: false };

      const sums = [];
      let allComplete = true;
      let isAbsent = false;

      for (const ev of evaluators) {
        const { total, isComplete: comp, isAbsent: abs } = this.getEvaluatorSum(stage, ev.id, candidateId);
        if (!comp) allComplete = false;
        if (abs) isAbsent = true;
        sums.push(total);
      }

      if (sums.length === 0) return { avg: 0, isComplete: false, isAbsent: false };

      const sum = sums.reduce((acc, curr) => acc + curr, 0);
      const avg = sum / sums.length;
      return { avg: Number(avg.toFixed(2)), isComplete: allComplete, isAbsent };
    },

    getBonusPoints(candidateId, docAvg, interviewAvg) {
      const proj = getActiveProject();
      const candidate = proj.candidates.find(c => c.id === candidateId);
      if (!candidate || candidate.bonusRuleId === 'none') return 0;

      const rule = proj.bonusRules.find(b => b.id === candidate.bonusRuleId);
      if (!rule) return 0;

      const baseWeightedTotal = (docAvg * (proj.docWeight / 100)) + 
                                (interviewAvg * (proj.interviewWeight / 100));

      if (rule.type === 'percent') {
        const bonus = baseWeightedTotal * (Number(rule.value) / 100);
        return Number(bonus.toFixed(2));
      } else if (rule.type === 'score') {
        return Number(Number(rule.value).toFixed(2));
      }

      return 0;
    },

    calculateCandidateSummary(candidateId) {
      const proj = getActiveProject();
      const docRes = this.getStageAverage('doc', candidateId);
      const intRes = this.getStageAverage('interview', candidateId);

      const isAbsent = docRes.isAbsent || intRes.isAbsent;

      const docWeighted = isAbsent ? 0 : Number((docRes.avg * (proj.docWeight / 100)).toFixed(2));
      const intWeighted = isAbsent ? 0 : Number((intRes.avg * (proj.interviewWeight / 100)).toFixed(2));

      const bonusPoints = isAbsent ? 0 : this.getBonusPoints(candidateId, docRes.avg, intRes.avg);
      const totalScore = isAbsent ? 0 : Number((docWeighted + intWeighted + bonusPoints).toFixed(2));

      const isDocCutoffFail = docRes.avg < proj.docCutoff;
      const isInterviewCutoffFail = intRes.avg < proj.interviewCutoff;
      const isCutoffFail = isAbsent || isDocCutoffFail || isInterviewCutoffFail;

      return {
        docAvg: docRes.avg,
        docWeighted,
        intAvg: intRes.avg,
        intWeighted,
        bonusPoints,
        totalScore,
        isAbsent,
        isDocCutoffFail,
        isInterviewCutoffFail,
        isCutoffFail,
        isComplete: docRes.isComplete && intRes.isComplete
      };
    },

    rankCandidates() {
      const proj = getActiveProject();

      const list = proj.candidates.map(candidate => {
        const summary = this.calculateCandidateSummary(candidate.id);
        const bonusRule = proj.bonusRules.find(b => b.id === candidate.bonusRuleId);

        return {
          ...candidate,
          summary,
          bonusRuleName: bonusRule ? bonusRule.name : '없음'
        };
      });

      list.sort((a, b) => {
        if (a.summary.isCutoffFail !== b.summary.isCutoffFail) {
          return a.summary.isCutoffFail ? 1 : -1;
        }

        if (Math.abs(b.summary.totalScore - a.summary.totalScore) > 0.001) {
          return b.summary.totalScore - a.summary.totalScore;
        }

        if (Math.abs(b.summary.intAvg - a.summary.intAvg) > 0.001) {
          return b.summary.intAvg - a.summary.intAvg;
        }

        return b.summary.docAvg - a.summary.docAvg;
      });

      let passCount = 0;
      let waitCount = 0;

      return list.map((item, index) => {
        let decision = 'FAIL';
        let decisionLabel = '불합격';
        let badgeClass = 'badge-fail';
        let note = '';

        if (item.summary.isAbsent) {
          decision = 'ABSENT';
          decisionLabel = '불참 (결시)';
          badgeClass = 'badge-cutoff';
          note = '전형 불참 (결시 처리)';
        } else if (item.summary.isCutoffFail) {
          decision = 'CUTOFF';
          decisionLabel = '과락 탈락';
          badgeClass = 'badge-cutoff';
          if (item.summary.isDocCutoffFail && item.summary.isInterviewCutoffFail) {
            note = '서류 및 면접 과락';
          } else if (item.summary.isDocCutoffFail) {
            note = `서류 과락 (${item.summary.docAvg}점 < ${proj.docCutoff}점)`;
          } else {
            note = `면접 과락 (${item.summary.intAvg}점 < ${proj.interviewCutoff}점)`;
          }
        } else {
          if (passCount < proj.passQuota) {
            passCount++;
            decision = 'PASS';
            decisionLabel = '합격';
            badgeClass = 'badge-pass';
          } else if (waitCount < proj.waitQuota) {
            waitCount++;
            decision = 'WAIT';
            decisionLabel = `예비 ${waitCount}번`;
            badgeClass = 'badge-wait';
          } else {
            decision = 'FAIL';
            decisionLabel = '불합격';
            badgeClass = 'badge-fail';
          }
        }

        return {
          ...item,
          rank: index + 1,
          decision,
          decisionLabel,
          badgeClass,
          note
        };
      });
    },

    runSystemAudit() {
      const proj = getActiveProject();
      let missingCount = 0;
      let outOfRangeCount = 0;

      const checkStage = (stage, evaluators, criteria) => {
        for (const ev of evaluators) {
          for (const cand of proj.candidates) {
            const att = this.getAttendance(stage, ev.id, cand.id);
            if (att === 'absent') continue;

            for (const crit of criteria) {
              const score = this.getScore(stage, ev.id, cand.id, crit.id);
              if (score === null || isNaN(score)) {
                missingCount++;
              } else if (score < 1 || score > 5) {
                outOfRangeCount++;
              }
            }
          }
        }
      };

      checkStage('doc', proj.docEvaluators, proj.docCriteria);
      checkStage('interview', proj.interviewEvaluators, proj.interviewCriteria);

      const cutoffCount = this.rankCandidates().filter(c => c.summary.isCutoffFail).length;

      return {
        missingCount,
        outOfRangeCount,
        cutoffCount,
        isClean: missingCount === 0 && outOfRangeCount === 0
      };
    }
  };

  window.RecruitmentApp.EvaluationEngine = EvaluationEngine;

  // ==========================================
  // 3. UI Renderer & Event Handlers (index.html Admin App)
  // ==========================================
  const UIRenderer = {
    init() {
      if (!document.getElementById('header-project-select')) return;

      this.bindGlobalControls();
      this.bindNavigation();
      this.bindSettingsTab();
      this.bindScoringTab();
      this.bindAggregationTab();
      this.bindDecisionTab();
      this.bindDataTab();
      this.bindModals();

      this.renderAll();
    },

    renderAll() {
      if (!document.getElementById('header-project-select')) return;
      this.renderProjectSelector();
      this.renderModeState();
      this.renderHeaderSummary();

      this.renderSettingsTab();
      this.renderScoringTab();
      this.renderAggregationTab();
      this.renderDecisionTab();
      this.renderDataTab();

      if (window.lucide) window.lucide.createIcons();
    },

    bindGlobalControls() {
      const projSelect = document.getElementById('header-project-select');
      projSelect.addEventListener('change', (e) => {
        state.activeProjectId = e.target.value;
        saveState();
        this.renderAll();
      });

      document.getElementById('btn-create-project-modal').addEventListener('click', () => {
        document.getElementById('modal-project').classList.add('active');
      });

      const btnAdmin = document.getElementById('btn-mode-admin');
      btnAdmin.addEventListener('click', () => {
        state.userMode = 'admin';
        saveState();
        this.renderModeState();
      });
    },

    renderProjectSelector() {
      const select = document.getElementById('header-project-select');
      select.innerHTML = '';

      state.projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.jobTitle;
        if (p.id === state.activeProjectId) opt.selected = true;
        select.appendChild(opt);
      });
    },

    renderModeState() {
      const btnAdmin = document.getElementById('btn-mode-admin');
      const navTabs = document.getElementById('main-nav-tabs');

      btnAdmin.classList.add('active');
      navTabs.style.display = 'flex';

      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      const activeNavBtn = document.querySelector(`.nav-tab[data-tab="${state.activeTab}"]`);
      if (activeNavBtn) activeNavBtn.classList.add('active');
      const activeTabEl = document.getElementById(state.activeTab);
      if (activeTabEl) activeTabEl.classList.add('active');
    },

    renderHeaderSummary() {
      const proj = getActiveProject();
      document.getElementById('header-job-title').textContent = proj.jobTitle;
      document.getElementById('header-doc-eval-count').textContent = proj.docEvaluators.length;
      document.getElementById('header-int-eval-count').textContent = proj.interviewEvaluators.length;
      document.getElementById('header-pass-quota').textContent = proj.passQuota;
      document.getElementById('header-wait-quota').textContent = proj.waitQuota;

      const audit = EvaluationEngine.runSystemAudit();
      const totalExpected = (proj.docCriteria.length * proj.docEvaluators.length * proj.candidates.length) +
                            (proj.interviewCriteria.length * proj.interviewEvaluators.length * proj.candidates.length);

      const filled = totalExpected - audit.missingCount;
      const pct = totalExpected > 0 ? Math.round((filled / totalExpected) * 100) : 0;

      document.getElementById('header-scoring-progress').textContent = `${pct}%`;
      document.getElementById('header-progress-bar').style.width = `${pct}%`;

      const auditStatusEl = document.getElementById('header-audit-status');
      if (audit.isClean) {
        auditStatusEl.className = 'summary-value text-success';
        auditStatusEl.innerHTML = '<i data-lucide="check-circle-2"></i> 수기 오류 0건 (정상)';
      } else {
        auditStatusEl.className = 'summary-value text-sub';
        auditStatusEl.innerHTML = `<i data-lucide="alert-circle"></i> 검수 필요 (${audit.missingCount}건 미입력)`;
      }
    },

    bindNavigation() {
      const tabs = document.querySelectorAll('.nav-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

          const targetId = tab.getAttribute('data-tab');
          tab.classList.add('active');
          document.getElementById(targetId).classList.add('active');

          state.activeTab = targetId;
          this.renderAll();
        });
      });

      const subtabs = document.querySelectorAll('.tab-sub-btn');
      subtabs.forEach(btn => {
        btn.addEventListener('click', () => {
          subtabs.forEach(s => s.classList.remove('active'));
          document.querySelectorAll('.subtab-content').forEach(sc => sc.classList.remove('active'));

          const subId = btn.getAttribute('data-subtab');
          btn.classList.add('active');
          document.getElementById(subId).classList.add('active');

          state.activeSubtab = subId;
        });
      });
    },

    renderSettingsTab() {
      const proj = getActiveProject();
      document.getElementById('setting-job-title').value = proj.jobTitle;
      document.getElementById('setting-doc-weight').value = proj.docWeight;
      document.getElementById('setting-interview-weight').value = proj.interviewWeight;
      document.getElementById('setting-pass-quota').value = proj.passQuota;
      document.getElementById('setting-wait-quota').value = proj.waitQuota;
      document.getElementById('setting-doc-cutoff').value = proj.docCutoff;
      document.getElementById('setting-interview-cutoff').value = proj.interviewCutoff;

      this.renderCommitteeTables();
      this.renderCriteriaEditors();
    },

    renderCommitteeTables() {
      const proj = getActiveProject();

      const docTbody = document.querySelector('#doc-eval-table tbody');
      docTbody.innerHTML = '';
      proj.docEvaluators.forEach((ev, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>서류위원 ${idx + 1}</strong></td>
          <td>${ev.name}</td>
          <td><small class="text-sub">${ev.role}</small></td>
          <td class="w-action">
            <button class="btn btn-sm btn-outline-danger btn-del-doc-eval" data-id="${ev.id}">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        `;
        docTbody.appendChild(tr);
      });

      docTbody.querySelectorAll('.btn-del-doc-eval').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          proj.docEvaluators = proj.docEvaluators.filter(e => e.id !== id);
          saveState();
          this.renderSettingsTab();
          this.renderHeaderSummary();
        });
      });

      const intTbody = document.querySelector('#interview-eval-table tbody');
      intTbody.innerHTML = '';
      proj.interviewEvaluators.forEach((ev, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>면접위원 ${idx + 1}</strong></td>
          <td>${ev.name}</td>
          <td><small class="text-sub">${ev.role}</small></td>
          <td class="w-action">
            <button class="btn btn-sm btn-outline-danger btn-del-int-eval" data-id="${ev.id}">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        `;
        intTbody.appendChild(tr);
      });

      intTbody.querySelectorAll('.btn-del-int-eval').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          proj.interviewEvaluators = proj.interviewEvaluators.filter(e => e.id !== id);
          saveState();
          this.renderSettingsTab();
          this.renderHeaderSummary();
        });
      });
    },

    renderCriteriaEditors() {
      const proj = getActiveProject();

      // Doc 5-Point Criteria Editor
      const docTbody = document.querySelector('#doc-crit-table tbody');
      if (docTbody) {
        docTbody.innerHTML = '';
        proj.docCriteria.forEach((crit, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><input type="text" class="form-control crit-name-input" data-stage="doc" data-idx="${idx}" value="${crit.name}"></td>
            <td class="text-center"><span class="badge badge-primary">5점 만점</span></td>
            <td><input type="text" class="form-control crit-desc-input" data-stage="doc" data-idx="${idx}" value="${crit.desc}"></td>
            <td class="w-action">
              <button class="btn btn-sm btn-outline-danger btn-del-crit" data-stage="doc" data-idx="${idx}">
                <i data-lucide="trash-2"></i>
              </button>
            </td>
          `;
          docTbody.appendChild(tr);
        });
        document.getElementById('doc-crit-sum').textContent = proj.docCriteria.length;
      }

      // Interview 5-Point Criteria Editor
      const intTbody = document.querySelector('#interview-crit-table tbody');
      if (intTbody) {
        intTbody.innerHTML = '';
        proj.interviewCriteria.forEach((crit, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><input type="text" class="form-control crit-name-input" data-stage="interview" data-idx="${idx}" value="${crit.name}"></td>
            <td class="text-center"><span class="badge badge-primary">5점 만점</span></td>
            <td><input type="text" class="form-control crit-desc-input" data-stage="interview" data-idx="${idx}" value="${crit.desc}"></td>
            <td class="w-action">
              <button class="btn btn-sm btn-outline-danger btn-del-crit" data-stage="interview" data-idx="${idx}">
                <i data-lucide="trash-2"></i>
              </button>
            </td>
          `;
          intTbody.appendChild(tr);
        });
        document.getElementById('int-crit-count').textContent = proj.interviewCriteria.length;
      }

      // Render Bonus Rules Editor
      this.renderBonusRulesEditor();

      const bindCriteriaInputs = (containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.querySelectorAll('input').forEach(input => {
          input.addEventListener('change', () => {
            const stage = input.getAttribute('data-stage');
            const idx = Number(input.getAttribute('data-idx'));
            const list = stage === 'doc' ? proj.docCriteria : proj.interviewCriteria;

            if (input.classList.contains('crit-name-input')) list[idx].name = input.value.trim();
            if (input.classList.contains('crit-desc-input')) list[idx].desc = input.value.trim();

            saveState();
          });
        });

        container.querySelectorAll('.btn-del-crit').forEach(btn => {
          btn.addEventListener('click', () => {
            const stage = btn.getAttribute('data-stage');
            const idx = Number(btn.getAttribute('data-idx'));
            const list = stage === 'doc' ? proj.docCriteria : proj.interviewCriteria;

            if (list.length <= 1) {
              alert('최소 1개 이상의 평가 항목이 존재해야 합니다.');
              return;
            }

            list.splice(idx, 1);
            saveState();
            this.renderCriteriaEditors();
          });
        });
      };

      bindCriteriaInputs('#doc-crit-table');
      bindCriteriaInputs('#interview-crit-table');
      if (window.lucide) window.lucide.createIcons();
    },

    renderBonusRulesEditor() {
      const proj = getActiveProject();
      const tbody = document.querySelector('#bonus-rules-table tbody');
      if (!tbody) return;

      tbody.innerHTML = '';

      if (!proj.bonusRules || proj.bonusRules.length === 0) {
        proj.bonusRules = JSON.parse(JSON.stringify(defaultBonusRules));
      }

      proj.bonusRules.forEach((rule, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="text" class="form-control bonus-name-input" data-idx="${idx}" value="${rule.name}"></td>
          <td>
            <select class="form-control bonus-type-select" data-idx="${idx}">
              <option value="percent" ${rule.type === 'percent' ? 'selected' : ''}>비율 가산 (%)</option>
              <option value="score" ${rule.type === 'score' ? 'selected' : ''}>점수 가산 (점)</option>
            </select>
          </td>
          <td><input type="number" step="0.5" class="form-control bonus-value-input" data-idx="${idx}" value="${rule.value}"></td>
          <td><input type="text" class="form-control bonus-desc-input" data-idx="${idx}" value="${rule.desc}"></td>
          <td class="w-action">
            <button class="btn btn-sm btn-outline-danger btn-del-bonus" data-idx="${idx}">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', () => {
          const idx = Number(el.getAttribute('data-idx'));
          const rule = proj.bonusRules[idx];
          if (!rule) return;

          if (el.classList.contains('bonus-name-input')) rule.name = el.value.trim();
          if (el.classList.contains('bonus-type-select')) rule.type = el.value;
          if (el.classList.contains('bonus-value-input')) rule.value = Number(el.value) || 0;
          if (el.classList.contains('bonus-desc-input')) rule.desc = el.value.trim();

          saveState();
        });
      });

      tbody.querySelectorAll('.btn-del-bonus').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-idx'));
          if (confirm('해당 가점 항목을 삭제하시겠습니까?')) {
            proj.bonusRules.splice(idx, 1);
            saveState();
            this.renderBonusRulesEditor();
          }
        });
      });
    },

    bindSettingsTab() {
      const proj = getActiveProject();

      document.getElementById('btn-add-doc-eval').addEventListener('click', () => {
        if (proj.docEvaluators.length >= 2) {
          alert('서류전형 위원은 규정상 최대 2명까지만 등록할 수 있습니다.');
          return;
        }
        document.getElementById('modal-eval-title').innerHTML = '<i data-lucide="user-plus"></i> 서류전형 위원 추가 (최대 2명)';
        document.getElementById('eval-target-stage').value = 'doc';
        document.getElementById('eval-name-input').value = '';
        document.getElementById('eval-role-input').value = '서류평가위원';
        document.getElementById('modal-evaluator').classList.add('active');
      });

      document.getElementById('btn-add-interview-eval').addEventListener('click', () => {
        if (proj.interviewEvaluators.length >= 5) {
          alert('면접전형 위원은 규정상 최대 5명까지만 등록할 수 있습니다.');
          return;
        }
        document.getElementById('modal-eval-title').innerHTML = '<i data-lucide="user-plus"></i> 면접전형 위원 추가 (최대 5명)';
        document.getElementById('eval-target-stage').value = 'interview';
        document.getElementById('eval-name-input').value = '';
        document.getElementById('eval-role-input').value = '면접평가위원';
        document.getElementById('modal-evaluator').classList.add('active');
      });

      document.getElementById('btn-add-doc-crit').addEventListener('click', () => {
        proj.docCriteria.push({
          id: 'dq_' + Date.now(),
          name: '신규 서류 5점 척도 항목',
          maxScore: 5,
          desc: '항목 세부 설명 및 채점 기준'
        });
        saveState();
        this.renderCriteriaEditors();
      });

      document.getElementById('btn-add-int-crit').addEventListener('click', () => {
        proj.interviewCriteria.push({
          id: 'iq_' + Date.now(),
          name: '신규 면접 5점 척도 항목',
          maxScore: 5,
          desc: '면접 채점 세부 설명 및 채점 기준'
        });
        saveState();
        this.renderCriteriaEditors();
      });

      const btnAddBonus = document.getElementById('btn-add-bonus-rule');
      if (btnAddBonus) {
        btnAddBonus.addEventListener('click', () => {
          proj.bonusRules.push({
            id: 'b_' + Date.now(),
            name: '신규 우대 가점 항목',
            type: 'percent',
            value: 3,
            desc: '가산점 적용 조건 및 상세 내용'
          });
          saveState();
          this.renderBonusRulesEditor();
        });
      }

      document.getElementById('btn-save-settings').addEventListener('click', () => {
        const docW = Number(document.getElementById('setting-doc-weight').value) || 0;
        const intW = Number(document.getElementById('setting-interview-weight').value) || 0;

        if (docW + intW !== 100) {
          alert('서류 및 면접 반영 비율의 합계는 100%이어야 합니다.');
          return;
        }

        proj.jobTitle = document.getElementById('setting-job-title').value.trim();
        proj.docWeight = docW;
        proj.interviewWeight = intW;
        proj.passQuota = Number(document.getElementById('setting-pass-quota').value) || 1;
        proj.waitQuota = Number(document.getElementById('setting-wait-quota').value) || 0;
        proj.docCutoff = Number(document.getElementById('setting-doc-cutoff').value) || 0;
        proj.interviewCutoff = Number(document.getElementById('setting-interview-cutoff').value) || 0;

        saveState();
        alert('채용 공고 설정, 전형별 평가 항목 및 가점 규정이 성공적으로 저장되었습니다.');
        this.renderAll();
      });
    },

    renderScoringTab() {
      const proj = getActiveProject();
      const stageSelect = document.getElementById('scoring-stage-select');
      stageSelect.value = state.activeScoringStage;

      const evalSelect = document.getElementById('scoring-evaluator-select');
      evalSelect.innerHTML = '';

      const evaluators = EvaluationEngine.getEvaluatorsForStage(state.activeScoringStage);

      if (evaluators.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '(등록된 위원 없음)';
        evalSelect.appendChild(opt);
        state.activeScoringEvaluator = '';
      } else {
        evaluators.forEach(ev => {
          const opt = document.createElement('option');
          opt.value = ev.id;
          opt.textContent = `${ev.name} (${ev.role})`;
          evalSelect.appendChild(opt);
        });

        if (!evaluators.some(e => e.id === state.activeScoringEvaluator)) {
          state.activeScoringEvaluator = evaluators[0].id;
        }
        evalSelect.value = state.activeScoringEvaluator;
      }

      const currentEv = evaluators.find(e => e.id === state.activeScoringEvaluator);
      const stageName = state.activeScoringStage === 'doc' ? '서류전형 (5점 척도)' : '면접전형 (5점 척도)';
      const evName = currentEv ? `${currentEv.name} (${currentEv.role})` : '선택 안됨';
      document.getElementById('current-eval-badge').textContent = `${stageName} - ${evName}`;

      this.renderScorecardTable();
    },

    renderScorecardTable() {
      const proj = getActiveProject();
      const stage = state.activeScoringStage;
      const evId = state.activeScoringEvaluator;
      const criteria = (stage === 'doc' ? proj.docCriteria : proj.interviewCriteria) || defaultCriteria[stage];

      const theadTr = document.getElementById('scorecard-thead-tr');
      theadTr.innerHTML = `
        <th class="text-center" style="width: 110px;">수험번호</th>
        <th class="text-center" style="width: 110px;">성명</th>
        <th class="text-center" style="width: 110px;">응시 참여</th>
      `;

      criteria.forEach(crit => {
        const th = document.createElement('th');
        th.className = 'text-center';
        th.innerHTML = `${crit.name}<br><small class="text-sub">(5점 척도)</small>`;
        theadTr.appendChild(th);
      });

      theadTr.innerHTML += `
        <th class="text-center" style="width: 130px;">5점 척도 합계<br><small class="text-sub">(100점 자동환산)</small></th>
        <th class="text-center" style="width: 100px;">입력 상태</th>
      `;

      const tbody = document.getElementById('scorecard-tbody');
      tbody.innerHTML = '';

      if (!evId) {
        tbody.innerHTML = `<tr><td colspan="${criteria.length + 5}" class="text-center text-sub">선택된 평가위원이 없습니다. 공고 설정에서 위원을 등록해주세요.</td></tr>`;
        return;
      }

      let doneCount = 0;

      proj.candidates.forEach(cand => {
        const tr = document.createElement('tr');
        const attendance = EvaluationEngine.getAttendance(stage, evId, cand.id);

        tr.innerHTML = `
          <td class="text-center"><strong>${cand.candidateNo}</strong></td>
          <td class="text-center">${cand.name}</td>
          <td class="text-center">
            <select class="form-control select-sm att-select" data-cand="${cand.id}">
              <option value="present" ${attendance === 'present' ? 'selected' : ''}>참여</option>
              <option value="absent" ${attendance === 'absent' ? 'selected' : ''}>불참</option>
            </select>
          </td>
        `;

        const attSelect = tr.querySelector('.att-select');
        attSelect.addEventListener('change', (e) => {
          EvaluationEngine.setAttendance(stage, evId, cand.id, e.target.value);
          this.renderScorecardTable();
          this.renderHeaderSummary();
        });

        if (attendance === 'absent') {
          criteria.forEach(() => {
            const td = document.createElement('td');
            td.className = 'text-center text-sub';
            td.innerHTML = '<span class="badge badge-cutoff">불참</span>';
            tr.appendChild(td);
          });

          doneCount++;

          const totalTd = document.createElement('td');
          totalTd.className = 'total-cell text-center';
          totalTd.innerHTML = `<strong class="text-danger">불참 (0점)</strong>`;
          tr.appendChild(totalTd);

          const statusTd = document.createElement('td');
          statusTd.className = 'text-center status-cell';
          statusTd.innerHTML = '<span class="status-pill warning"><i data-lucide="x"></i> 불참</span>';
          tr.appendChild(statusTd);

        } else {
          let isRowComplete = true;

          criteria.forEach(crit => {
            const val = EvaluationEngine.getScore(stage, evId, cand.id, crit.id);
            const td = document.createElement('td');
            td.className = 'text-center';

            const select = document.createElement('select');
            select.className = 'form-control select-sm';
            select.innerHTML = `
              <option value="">- 선택 -</option>
              <option value="5" ${val === 5 ? 'selected' : ''}>5점 (매우우수)</option>
              <option value="4" ${val === 4 ? 'selected' : ''}>4점 (우수)</option>
              <option value="3" ${val === 3 ? 'selected' : ''}>3점 (보통)</option>
              <option value="2" ${val === 2 ? 'selected' : ''}>2점 (미흡)</option>
              <option value="1" ${val === 1 ? 'selected' : ''}>1점 (매우미흡)</option>
            `;

            select.addEventListener('change', (e) => {
              let num = e.target.value === '' ? null : Number(e.target.value);
              if (!proj.scores[stage]) proj.scores[stage] = {};
              if (!proj.scores[stage][evId]) proj.scores[stage][evId] = {};
              if (!proj.scores[stage][evId][cand.id]) proj.scores[stage][evId][cand.id] = {};

              proj.scores[stage][evId][cand.id][crit.id] = num;
              saveState();

              const res = EvaluationEngine.getEvaluatorSum(stage, evId, cand.id);
              const totalTd = tr.querySelector('.total-cell');
              const statusTd = tr.querySelector('.status-cell');

              if (totalTd) totalTd.innerHTML = `<strong>${res.rawTotal}점</strong> <small class="text-sub">(${res.convertedTotal}점 환산)</small>`;
              if (statusTd) {
                statusTd.innerHTML = res.isComplete ? '<span class="status-pill success"><i data-lucide="check"></i> 완료</span>' : '<span class="status-pill warning">미완료</span>';
              }

              this.renderHeaderSummary();
              if (window.lucide) window.lucide.createIcons();
            });

            if (val === null || isNaN(val)) isRowComplete = false;
            td.appendChild(select);
            tr.appendChild(td);
          });

          if (isRowComplete) doneCount++;

          const evSum = EvaluationEngine.getEvaluatorSum(stage, evId, cand.id);
          const totalTd = document.createElement('td');
          totalTd.className = 'total-cell text-center';
          totalTd.innerHTML = `<strong>${evSum.rawTotal}점</strong> <small class="text-sub">(${evSum.convertedTotal}점 환산)</small>`;
          tr.appendChild(totalTd);

          const statusTd = document.createElement('td');
          statusTd.className = 'text-center status-cell';
          statusTd.innerHTML = isRowComplete ? '<span class="status-pill success"><i data-lucide="check"></i> 완료</span>' : '<span class="status-pill warning">미완료</span>';
          tr.appendChild(statusTd);
        }

        tbody.appendChild(tr);
      });

      document.getElementById('scoring-done-count').textContent = doneCount;
      document.getElementById('scoring-total-count').textContent = proj.candidates.length;

      const validStatusEl = document.getElementById('scoring-valid-status');
      if (doneCount === proj.candidates.length && proj.candidates.length > 0) {
        validStatusEl.className = 'status-pill success';
        validStatusEl.innerHTML = '<i data-lucide="check-circle"></i> 모든 지원자 점수 입력 완료';
      } else {
        validStatusEl.className = 'status-pill warning';
        validStatusEl.innerHTML = `<i data-lucide="alert-triangle"></i> 작성 중 (${proj.candidates.length - doneCount}명 미완료)`;
      }
    },

    bindScoringTab() {
      document.getElementById('scoring-stage-select').addEventListener('change', (e) => {
        state.activeScoringStage = e.target.value;
        this.renderScoringTab();
      });

      document.getElementById('scoring-evaluator-select').addEventListener('change', (e) => {
        state.activeScoringEvaluator = e.target.value;
        this.renderScoringTab();
      });

      document.getElementById('btn-mark-eval-complete').addEventListener('click', () => {
        alert('현재 평가위원의 점수 제출이 완료 확정되었습니다.');
      });
    },

    renderAggregationTab() {
      const proj = getActiveProject();
      const audit = EvaluationEngine.runSystemAudit();
      document.getElementById('audit-missing-count').textContent = `${audit.missingCount}건`;
      document.getElementById('audit-outofrange-count').textContent = `${audit.outOfRangeCount}건`;
      document.getElementById('audit-cutoff-count').textContent = `${audit.cutoffCount}명`;

      document.querySelectorAll('.doc-w-label').forEach(el => el.textContent = proj.docWeight);
      document.querySelectorAll('.int-w-label').forEach(el => el.textContent = proj.interviewWeight);

      this.renderWeightedSummaryTable();
      this.renderStageBreakdownTable('doc');
      this.renderStageBreakdownTable('interview');
    },

    renderWeightedSummaryTable() {
      const tbody = document.querySelector('#weighted-summary-table tbody');
      tbody.innerHTML = '';

      const ranked = EvaluationEngine.rankCandidates();

      ranked.forEach(item => {
        const tr = document.createElement('tr');
        const summary = item.summary;

        tr.innerHTML = `
          <td><strong>${item.candidateNo}</strong></td>
          <td>${item.name}</td>
          <td><small class="text-sub">${item.bonusRuleName}</small></td>
          <td class="text-right">${summary.isAbsent ? '-' : summary.docAvg + '점'}</td>
          <td class="text-right text-primary"><strong>${summary.isAbsent ? '-' : summary.docWeighted + '점'}</strong></td>
          <td class="text-right">${summary.isAbsent ? '-' : summary.intAvg + '점'}</td>
          <td class="text-right text-indigo"><strong>${summary.isAbsent ? '-' : summary.intWeighted + '점'}</strong></td>
          <td class="text-right text-success">${summary.isAbsent ? '-' : '+' + summary.bonusPoints + '점'}</td>
          <td class="text-right"><strong style="font-size: 1.05rem; color: var(--color-primary);">${summary.isAbsent ? '0점 (불참)' : summary.totalScore + '점'}</strong></td>
          <td class="text-center">${summary.isAbsent ? '<span class="badge badge-cutoff">불참</span>' : (summary.isCutoffFail ? '<span class="badge badge-cutoff">과락</span>' : '<span class="text-success">통과</span>')}</td>
          <td class="text-center"><span class="badge ${item.badgeClass}">${item.decisionLabel}</span></td>
        `;
        tbody.appendChild(tr);
      });
    },

    renderStageBreakdownTable(stage) {
      const proj = getActiveProject();
      const tableId = stage === 'doc' ? '#doc-breakdown-table' : '#interview-breakdown-table';
      const table = document.querySelector(tableId);

      const evaluators = stage === 'doc' ? proj.docEvaluators : proj.interviewEvaluators;
      const cutoff = stage === 'doc' ? proj.docCutoff : proj.interviewCutoff;

      const thead = table.querySelector('thead');
      let thHtml = `
        <tr>
          <th>수험번호</th>
          <th>성명</th>
      `;

      evaluators.forEach((ev, idx) => {
        const title = stage === 'doc' ? `서류위원 ${idx+1}` : `면접위원 ${idx+1}`;
        thHtml += `<th class="text-center">${ev.name}<br><small class="text-sub">(${title})</small></th>`;
      });

      thHtml += `
          <th class="text-center">위원 평균 (100점 환산)</th>
          <th class="text-center">과락 및 불참 여부</th>
        </tr>
      `;
      thead.innerHTML = thHtml;

      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '';

      proj.candidates.forEach(cand => {
        const tr = document.createElement('tr');
        let rowHtml = `
          <td><strong>${cand.candidateNo}</strong></td>
          <td>${cand.name}</td>
        `;

        let isCandAbsent = false;

        evaluators.forEach(ev => {
          const res = EvaluationEngine.getEvaluatorSum(stage, ev.id, cand.id);
          if (res.isAbsent) {
            isCandAbsent = true;
            rowHtml += `<td class="text-center text-sub"><span class="badge badge-cutoff">불참</span></td>`;
          } else {
            rowHtml += `<td class="text-center">${res.isComplete ? res.rawTotal + '점 (' + res.convertedTotal + '점)' : '<span class="text-sub">-</span>'}</td>`;
          }
        });

        const stageAvgRes = EvaluationEngine.getStageAverage(stage, cand.id);
        const isCutoff = stageAvgRes.avg < cutoff;

        if (isCandAbsent || stageAvgRes.isAbsent) {
          rowHtml += `
            <td class="text-center text-danger"><strong>0점 (불참)</strong></td>
            <td class="text-center"><span class="badge badge-cutoff">불참 (결시)</span></td>
          `;
        } else {
          rowHtml += `
            <td class="text-center"><strong>${stageAvgRes.avg}점</strong></td>
            <td class="text-center">${isCutoff ? '<span class="badge badge-cutoff">과락</span>' : '<span class="badge badge-pass">통과</span>'}</td>
          `;
        }

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
      });
    },

    bindAggregationTab() {
      document.getElementById('btn-recalculate').addEventListener('click', () => {
        this.renderAggregationTab();
        alert('실시간 집계 및 검수가 완료되었습니다.');
      });

      document.getElementById('btn-export-doc-stage').addEventListener('click', () => {
        ExcelService.exportDocResults();
      });

      document.getElementById('btn-export-int-stage').addEventListener('click', () => {
        ExcelService.exportInterviewResults();
      });

      document.getElementById('btn-export-final-top').addEventListener('click', () => {
        ExcelService.exportFinalDecisionResults();
      });
    },

    renderDecisionTab() {
      const proj = getActiveProject();
      const ranked = EvaluationEngine.rankCandidates();

      document.getElementById('print-official-title').textContent = `${proj.jobTitle} 최종 합격자 결정 심사의결서`;
      document.getElementById('print-job-title').textContent = proj.jobTitle;
      document.getElementById('print-pass-quota').textContent = proj.passQuota;
      document.getElementById('print-wait-quota').textContent = proj.waitQuota;
      document.getElementById('print-doc-weight').textContent = proj.docWeight;
      document.getElementById('print-interview-weight').textContent = proj.interviewWeight;

      const today = new Date();
      const dateStr = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`;
      document.getElementById('print-date').textContent = dateStr;

      let passCount = 0, waitCount = 0, failCount = 0, cutoffCount = 0;
      ranked.forEach(r => {
        if (r.decision === 'PASS') passCount++;
        else if (r.decision === 'WAIT') waitCount++;
        else if (r.decision === 'FAIL') failCount++;
        else if (r.decision === 'CUTOFF' || r.decision === 'ABSENT') cutoffCount++;
      });

      document.getElementById('dec-pass-count').textContent = passCount;
      document.getElementById('dec-wait-count').textContent = waitCount;
      document.getElementById('dec-fail-count').textContent = failCount;
      document.getElementById('dec-cutoff-count').textContent = cutoffCount;

      const tbody = document.getElementById('final-decision-tbody');
      tbody.innerHTML = '';

      ranked.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="text-center"><strong>${item.rank}</strong></td>
          <td class="text-center">${item.candidateNo}</td>
          <td class="text-center"><strong>${item.name}</strong></td>
          <td class="text-right">${item.summary.isAbsent ? '-' : item.summary.docWeighted}</td>
          <td class="text-right">${item.summary.isAbsent ? '-' : item.summary.intWeighted}</td>
          <td class="text-right">${item.summary.isAbsent ? '-' : item.summary.bonusPoints}</td>
          <td class="text-right"><strong style="font-size: 1.05rem;">${item.summary.isAbsent ? '불참 (0)' : item.summary.totalScore}</strong></td>
          <td class="text-center">${item.summary.isAbsent ? '<span class="badge badge-cutoff">불참</span>' : (item.summary.isCutoffFail ? '<span class="badge badge-cutoff">과락</span>' : '정상')}</td>
          <td class="text-center"><span class="badge ${item.badgeClass}">${item.decisionLabel}</span></td>
          <td class="small text-sub">${item.note}</td>
        `;
        tbody.appendChild(tr);
      });

      const sigContainer = document.getElementById('sig-grid-container');
      sigContainer.innerHTML = '';

      proj.docEvaluators.forEach((ev, idx) => {
        const box = document.createElement('div');
        box.className = 'sig-box';
        box.innerHTML = `
          <div class="sig-role">서류평가위원 ${idx+1} (${ev.role})</div>
          <div class="sig-name">${ev.name}</div>
          <div class="sig-space">(서명 / 인)</div>
        `;
        sigContainer.appendChild(box);
      });

      proj.interviewEvaluators.forEach((ev, idx) => {
        const box = document.createElement('div');
        box.className = 'sig-box';
        box.innerHTML = `
          <div class="sig-role">면접평가위원 ${idx+1} (${ev.role})</div>
          <div class="sig-name">${ev.name}</div>
          <div class="sig-space">(서명 / 인)</div>
        `;
        sigContainer.appendChild(box);
      });
    },

    bindDecisionTab() {
      document.getElementById('btn-print-report').addEventListener('click', () => {
        window.print();
      });

      document.getElementById('btn-confirm-final').addEventListener('click', () => {
        const proj = getActiveProject();
        if (confirm(`'${proj.jobTitle}' 최종 합격자 결정을 확정하고 마감 처리하시겠습니까?`)) {
          alert('최종 합격자 결정이 확정되었습니다.');
        }
      });
    },

    renderDataTab() {
      const proj = getActiveProject();
      document.getElementById('candidate-list-count').textContent = proj.candidates.length;

      const tbody = document.querySelector('#candidate-list-table tbody');
      tbody.innerHTML = '';

      proj.candidates.forEach(cand => {
        const tr = document.createElement('tr');
        const bonusRule = proj.bonusRules.find(b => b.id === cand.bonusRuleId);
        const bonusName = bonusRule ? bonusRule.name : '없음';

        tr.innerHTML = `
          <td><strong>${cand.candidateNo}</strong></td>
          <td>${cand.name}</td>
          <td>${cand.birth || '-'}</td>
          <td>${cand.phone || '-'}</td>
          <td><span class="badge badge-secondary">${bonusName}</span></td>
          <td class="w-action">
            <button class="btn btn-sm btn-outline-danger btn-del-cand" data-id="${cand.id}">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-del-cand').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (confirm('해당 지원자를 삭제하시겠습니까?')) {
            proj.candidates = proj.candidates.filter(c => c.id !== id);
            saveState();
            this.renderAll();
          }
        });
      });
    },

    bindDataTab() {
      document.getElementById('btn-add-candidate-modal').addEventListener('click', () => {
        this.openCandidateModal();
      });

      document.getElementById('btn-export-doc-file').addEventListener('click', () => {
        ExcelService.exportDocResults();
      });

      document.getElementById('btn-export-int-file').addEventListener('click', () => {
        ExcelService.exportInterviewResults();
      });

      document.getElementById('btn-export-final-file').addEventListener('click', () => {
        ExcelService.exportFinalDecisionResults();
      });

      document.getElementById('btn-export-package-file').addEventListener('click', () => {
        ExcelService.exportAllPackage();
      });

      document.getElementById('btn-download-template').addEventListener('click', () => {
        ExcelService.exportTemplate();
      });

      document.getElementById('excel-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          ExcelService.importExcel(file, () => {
            this.renderAll();
          });
        }
      });

      document.getElementById('btn-load-demo').addEventListener('click', () => {
        const proj = buildDemoProject();
        proj.id = 'proj_' + Date.now();
        proj.jobTitle = `2026년도 신규 데모 채용공고 (${state.projects.length + 1})`;
        state.projects.push(proj);
        state.activeProjectId = proj.id;
        saveState();
        this.renderAll();
        alert('신규 데모 채용 공고가 생성되었습니다.');
      });

      document.getElementById('btn-reset-current').addEventListener('click', () => {
        const proj = getActiveProject();
        if (confirm(`'${proj.jobTitle}'의 지원자 및 점수 데이터를 초기화하시겠습니까?`)) {
          proj.candidates = [];
          proj.scores = { doc: {}, interview: {} };
          saveState();
          this.renderAll();
          alert('데이터가 초기화되었습니다.');
        }
      });
    },

    openCandidateModal() {
      const proj = getActiveProject();
      const select = document.getElementById('cand-bonus-select');
      select.innerHTML = '<option value="none">해당 없음 (0점)</option>';

      proj.bonusRules.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `${r.name} (${r.type === 'percent' ? '+' + r.value + '%' : '+' + r.value + '점'})`;
        select.appendChild(opt);
      });

      document.getElementById('cand-no').value = `A-2026-0${proj.candidates.length + 1}`;
      document.getElementById('cand-name').value = '';
      document.getElementById('modal-candidate').classList.add('active');
    },

    bindModals() {
      // QR Code Modal Handlers
      const openQrModal = () => {
        const proj = getActiveProject();
        const evaluatorUrl = 'https://input-three-liard.vercel.app/evaluator.html';

        const jobTitleEl = document.getElementById('qr-modal-job-title');
        if (jobTitleEl) jobTitleEl.textContent = proj.jobTitle;

        const urlTextEl = document.getElementById('qr-modal-url-text');
        if (urlTextEl) urlTextEl.textContent = evaluatorUrl;

        const linkBtnEl = document.getElementById('qr-modal-link-btn');
        if (linkBtnEl) {
          linkBtnEl.href = evaluatorUrl;
          linkBtnEl.innerHTML = `<i data-lucide="external-link"></i> ${evaluatorUrl} 직접 접속하기`;
        }

        const qrImg = document.getElementById('qr-code-img');
        if (qrImg) {
          qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(evaluatorUrl)}`;
        }

        const canvasBox = document.getElementById('qr-code-canvas-box');
        if (canvasBox) {
          canvasBox.innerHTML = '';
          if (typeof QRCode !== 'undefined') {
            try {
              new QRCode(canvasBox, {
                text: evaluatorUrl,
                width: 240,
                height: 240,
                colorDark: '#0f172a',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
              });
              if (qrImg) qrImg.style.display = 'none';
            } catch (e) {
              console.warn('QRCode JS render error, fallback to img:', e);
              if (qrImg) qrImg.style.display = 'block';
            }
          } else {
            if (qrImg) qrImg.style.display = 'block';
          }
        }

        const modalEl = document.getElementById('modal-qrcode');
        if (modalEl) modalEl.classList.add('active');
        if (window.lucide) window.lucide.createIcons();
      };

      const btnOpenQr = document.getElementById('btn-open-qr-modal');
      if (btnOpenQr) btnOpenQr.addEventListener('click', openQrModal);

      const btnShowQrCard = document.getElementById('btn-show-qr-card');
      if (btnShowQrCard) btnShowQrCard.addEventListener('click', openQrModal);

      const btnCloseQr = document.getElementById('btn-close-qr-modal');
      if (btnCloseQr) {
        btnCloseQr.addEventListener('click', () => {
          document.getElementById('modal-qrcode').classList.remove('active');
        });
      }

      const btnCancelQr = document.getElementById('btn-cancel-qr');
      if (btnCancelQr) {
        btnCancelQr.addEventListener('click', () => {
          document.getElementById('modal-qrcode').classList.remove('active');
        });
      }

      const btnPrintQr = document.getElementById('btn-print-qr');
      if (btnPrintQr) {
        btnPrintQr.addEventListener('click', () => {
          window.print();
        });
      }

      document.getElementById('btn-close-project-modal').addEventListener('click', () => {
        document.getElementById('modal-project').classList.remove('active');
      });
      document.getElementById('btn-cancel-project').addEventListener('click', () => {
        document.getElementById('modal-project').classList.remove('active');
      });
      document.getElementById('btn-save-project').addEventListener('click', (e) => {
        e.preventDefault();
        const title = document.getElementById('new-proj-title').value.trim();
        const pass = Number(document.getElementById('new-proj-pass').value) || 1;
        const wait = Number(document.getElementById('new-proj-wait').value) || 0;

        if (!title) {
          alert('채용 공고명을 입력해주세요.');
          return;
        }

        const newProj = {
          id: 'proj_' + Date.now(),
          jobTitle: title,
          docWeight: 30,
          interviewWeight: 70,
          passQuota: pass,
          waitQuota: wait,
          docCutoff: 60,
          interviewCutoff: 60,
          calcMethod: 'mean',
          docEvaluators: [
            { id: 'doc_ev_' + Date.now() + '_1', name: '서류위원 A', role: '서류평가위원' },
            { id: 'doc_ev_' + Date.now() + '_2', name: '서류위원 B', role: '서류평가위원' }
          ],
          interviewEvaluators: [
            { id: 'int_ev_' + Date.now() + '_1', name: '면접위원 1 (위원장)', role: '평가위원장' },
            { id: 'int_ev_' + Date.now() + '_2', name: '면접위원 2', role: '면접평가위원' },
            { id: 'int_ev_' + Date.now() + '_3', name: '면접위원 3', role: '면접평가위원' }
          ],
          docCriteria: JSON.parse(JSON.stringify(defaultCriteria.doc)),
          interviewCriteria: JSON.parse(JSON.stringify(defaultCriteria.interview)),
          bonusRules: JSON.parse(JSON.stringify(defaultBonusRules)),
          candidates: [],
          scores: { doc: {}, interview: {} }
        };

        state.projects.push(newProj);
        state.activeProjectId = newProj.id;
        saveState();
        document.getElementById('modal-project').classList.remove('active');
        this.renderAll();
        alert(`'${title}' 공고가 새롭게 추가되었습니다.`);
      });

      document.getElementById('btn-close-candidate-modal').addEventListener('click', () => {
        document.getElementById('modal-candidate').classList.remove('active');
      });
      document.getElementById('btn-cancel-candidate').addEventListener('click', () => {
        document.getElementById('modal-candidate').classList.remove('active');
      });
      document.getElementById('btn-save-candidate').addEventListener('click', (e) => {
        e.preventDefault();
        const proj = getActiveProject();
        const no = document.getElementById('cand-no').value.trim();
        const name = document.getElementById('cand-name').value.trim();
        const birth = document.getElementById('cand-birth').value;
        const phone = document.getElementById('cand-phone').value.trim();
        const bonusRuleId = document.getElementById('cand-bonus-select').value;

        if (!no || !name) {
          alert('수험번호와 성명은 필수 항목입니다.');
          return;
        }

        proj.candidates.push({
          id: 'c_' + Date.now(),
          candidateNo: no,
          name,
          birth,
          phone,
          bonusRuleId
        });

        saveState();
        document.getElementById('modal-candidate').classList.remove('active');
        this.renderAll();
      });

      document.getElementById('btn-close-evaluator-modal').addEventListener('click', () => {
        document.getElementById('modal-evaluator').classList.remove('active');
      });
      document.getElementById('btn-cancel-evaluator').addEventListener('click', () => {
        document.getElementById('modal-evaluator').classList.remove('active');
      });
      document.getElementById('btn-save-evaluator').addEventListener('click', (e) => {
        e.preventDefault();
        const proj = getActiveProject();
        const stage = document.getElementById('eval-target-stage').value;
        const name = document.getElementById('eval-name-input').value.trim();
        const role = document.getElementById('eval-role-input').value.trim() || (stage === 'doc' ? '서류평가위원' : '면접평가위원');

        if (!name) {
          alert('위원의 이름을 입력해 주세요.');
          return;
        }

        if (stage === 'doc') {
          if (proj.docEvaluators.length >= 2) {
            alert('서류전형 위원은 규정상 최대 2명까지 등록 가능합니다.');
            return;
          }
          proj.docEvaluators.push({ id: 'doc_ev_' + Date.now(), name, role });
        } else {
          if (proj.interviewEvaluators.length >= 5) {
            alert('면접전형 위원은 규정상 최대 5명까지 등록 가능합니다.');
            return;
          }
          proj.interviewEvaluators.push({ id: 'int_ev_' + Date.now(), name, role });
        }

        saveState();
        document.getElementById('modal-evaluator').classList.remove('active');
        this.renderAll();
      });
    }
  };

  // ==========================================
  // 4. Excel Service
  // ==========================================
  const ExcelService = {
    exportDocResults() {
      if (typeof XLSX === 'undefined') return;
      const proj = getActiveProject();
      const evaluatorHeader = proj.docEvaluators.map((ev, idx) => `서류위원${idx+1} (${ev.name})`);

      const rows = [
        [`${proj.jobTitle} 서류전형 집계 결과표 (5점 척도)`],
        ['공고명:', proj.jobTitle],
        ['서류과락기준:', `${proj.docCutoff}점 미만 과락`],
        ['서류반영비율:', `${proj.docWeight}%`],
        [],
        ['수험번호', '성명', ...evaluatorHeader, '서류평균 (100점 환산)', `서류환산점 (${proj.docWeight}%)`, '과락/불참여부']
      ];

      proj.candidates.forEach(cand => {
        const evScores = proj.docEvaluators.map(ev => {
          const res = EvaluationEngine.getEvaluatorSum('doc', ev.id, cand.id);
          if (res.isAbsent) return '불참 (0점)';
          return res.isComplete ? `${res.rawTotal}점 (${res.convertedTotal}점 환산)` : '-';
        });

        const stageRes = EvaluationEngine.getStageAverage('doc', cand.id);
        const weighted = stageRes.isAbsent ? 0 : Number((stageRes.avg * (proj.docWeight / 100)).toFixed(2));
        const isCutoff = stageRes.avg < proj.docCutoff;

        rows.push([
          cand.candidateNo,
          cand.name,
          ...evScores,
          stageRes.isAbsent ? '불참 (0점)' : stageRes.avg,
          stageRes.isAbsent ? '0점' : weighted,
          stageRes.isAbsent ? '불참 (결시)' : (isCutoff ? '과락 탈락' : '통과')
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, '서류전형집계표');
      XLSX.writeFile(wb, `${proj.jobTitle}_서류전형_집계결과표.xlsx`);
    },

    exportInterviewResults() {
      if (typeof XLSX === 'undefined') return;
      const proj = getActiveProject();
      const evaluatorHeader = proj.interviewEvaluators.map((ev, idx) => `면접위원${idx+1} (${ev.name})`);

      const rows = [
        [`${proj.jobTitle} 면접전형 집계 결과표 (5점 척도)`],
        ['공고명:', proj.jobTitle],
        ['면접과락기준:', `${proj.interviewCutoff}점 미만 과락`],
        ['면접반영비율:', `${proj.interviewWeight}%`],
        [],
        ['수험번호', '성명', ...evaluatorHeader, '면접평균 (100점 환산)', `면접환산점 (${proj.interviewWeight}%)`, '과락/불참여부']
      ];

      proj.candidates.forEach(cand => {
        const evScores = proj.interviewEvaluators.map(ev => {
          const res = EvaluationEngine.getEvaluatorSum('interview', ev.id, cand.id);
          if (res.isAbsent) return '불참 (0점)';
          return res.isComplete ? `${res.rawTotal}점 (${res.convertedTotal}점 환산)` : '-';
        });

        const stageRes = EvaluationEngine.getStageAverage('interview', cand.id);
        const weighted = stageRes.isAbsent ? 0 : Number((stageRes.avg * (proj.interviewWeight / 100)).toFixed(2));
        const isCutoff = stageRes.avg < proj.interviewCutoff;

        rows.push([
          cand.candidateNo,
          cand.name,
          ...evScores,
          stageRes.isAbsent ? '불참 (0점)' : stageRes.avg,
          stageRes.isAbsent ? '0점' : weighted,
          stageRes.isAbsent ? '불참 (결시)' : (isCutoff ? '과락 탈락' : '통과')
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, '면접전형집계표');
      XLSX.writeFile(wb, `${proj.jobTitle}_면접전형_집계결과표.xlsx`);
    },

    exportFinalDecisionResults() {
      if (typeof XLSX === 'undefined') return;
      const proj = getActiveProject();
      const ranked = EvaluationEngine.rankCandidates();

      const matrixData = [
        [`${proj.jobTitle} 최종 합격자 결정표`],
        ['공고명:', proj.jobTitle],
        ['선발정원:', `합격 ${proj.passQuota}명 / 예비 ${proj.waitQuota}명`],
        ['평가비율:', `서류 ${proj.docWeight}% + 면접 ${proj.interviewWeight}%`],
        [],
        ['석차', '수험번호', '성명', `서류환산 (${proj.docWeight}점)`, `면접환산 (${proj.interviewWeight}점)`, '가산점', '최종총점', '과락/불참여부', '최종판정', '비고 및 우선순위 사유']
      ];

      ranked.forEach(item => {
        matrixData.push([
          item.rank,
          item.candidateNo,
          item.name,
          item.summary.isAbsent ? '-' : item.summary.docWeighted,
          item.summary.isAbsent ? '-' : item.summary.intWeighted,
          item.summary.isAbsent ? '-' : item.summary.bonusPoints,
          item.summary.isAbsent ? '불참 (0)' : item.summary.totalScore,
          item.summary.isAbsent ? '불참' : (item.summary.isCutoffFail ? '과락' : '정상'),
          item.decisionLabel,
          item.note
        ]);
      });

      const wb = XLSX.utils.book_new();
      const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);
      XLSX.utils.book_append_sheet(wb, wsMatrix, '최종합격자결정표');
      XLSX.writeFile(wb, `${proj.jobTitle}_최종합격자결정표.xlsx`);
    },

    exportAllPackage() {
      if (typeof XLSX === 'undefined') return;
      const proj = getActiveProject();
      const wb = XLSX.utils.book_new();

      const ranked = EvaluationEngine.rankCandidates();
      const finalRows = [
        [`${proj.jobTitle} 최종 합격자 결정표`],
        ['공고명:', proj.jobTitle],
        ['선발정원:', `합격 ${proj.passQuota}명 / 예비 ${proj.waitQuota}명`],
        [],
        ['석차', '수험번호', '성명', `서류환산(${proj.docWeight}%)`, `면접환산(${proj.interviewWeight}%)`, '가산점', '최종총점', '과락/불참여부', '최종판정', '비고']
      ];
      ranked.forEach(item => {
        finalRows.push([
          item.rank, item.candidateNo, item.name, item.summary.isAbsent ? '-' : item.summary.docWeighted,
          item.summary.isAbsent ? '-' : item.summary.intWeighted, item.summary.isAbsent ? '-' : item.summary.bonusPoints,
          item.summary.isAbsent ? '불참(0)' : item.summary.totalScore,
          item.summary.isAbsent ? '불참' : (item.summary.isCutoffFail ? '과락' : '정상'), item.decisionLabel, item.note
        ]);
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(finalRows), '최종합격자결정표');

      const docEvalHeader = proj.docEvaluators.map((ev, idx) => `서류위원${idx+1} (${ev.name})`);
      const docRows = [
        [`${proj.jobTitle} 서류전형 집계표`],
        [],
        ['수험번호', '성명', ...docEvalHeader, '서류평균(100)', `서류환산(${proj.docWeight}%)`, '과락/불참']
      ];
      proj.candidates.forEach(cand => {
        const evScores = proj.docEvaluators.map(ev => {
          const res = EvaluationEngine.getEvaluatorSum('doc', ev.id, cand.id);
          if (res.isAbsent) return '불참 (0)';
          return res.isComplete ? `${res.rawTotal}점 (${res.convertedTotal}점)` : '-';
        });
        const stageRes = EvaluationEngine.getStageAverage('doc', cand.id);
        const weighted = stageRes.isAbsent ? 0 : Number((stageRes.avg * (proj.docWeight / 100)).toFixed(2));
        docRows.push([cand.candidateNo, cand.name, ...evScores, stageRes.isAbsent ? '불참' : stageRes.avg, weighted, stageRes.isAbsent ? '불참' : (stageRes.avg < proj.docCutoff ? '과락' : '통과')]);
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(docRows), '서류전형집계표');

      const intEvalHeader = proj.interviewEvaluators.map((ev, idx) => `면접위원${idx+1} (${ev.name})`);
      const intRows = [
        [`${proj.jobTitle} 면접전형 집계표`],
        [],
        ['수험번호', '성명', ...intEvalHeader, '면접평균(100점환산)', `면접환산(${proj.interviewWeight}%)`, '과락/불참']
      ];
      proj.candidates.forEach(cand => {
        const evScores = proj.interviewEvaluators.map(ev => {
          const res = EvaluationEngine.getEvaluatorSum('interview', ev.id, cand.id);
          if (res.isAbsent) return '불참 (0)';
          return res.isComplete ? `${res.rawTotal}점 (${res.convertedTotal}점)` : '-';
        });
        const stageRes = EvaluationEngine.getStageAverage('interview', cand.id);
        const weighted = stageRes.isAbsent ? 0 : Number((stageRes.avg * (proj.interviewWeight / 100)).toFixed(2));
        intRows.push([cand.candidateNo, cand.name, ...intScores, stageRes.isAbsent ? '불참' : stageRes.avg, weighted, stageRes.isAbsent ? '불참' : (stageRes.avg < proj.interviewCutoff ? '과락' : '통과')]);
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(intRows), '면접전형집계표');

      XLSX.writeFile(wb, `${proj.jobTitle}_전전형_통합채용집계표.xlsx`);
    },

    exportTemplate() {
      if (typeof XLSX === 'undefined') return;
      const templateData = [
        ['수험번호', '성명', '생년월일', '연락처', '가산점구분'],
        ['A-2026-001', '홍길동', '1995-01-01', '010-1234-5678', 'b1'],
        ['A-2026-002', '이몽룡', '1996-02-02', '010-2345-6789', 'none']
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      XLSX.utils.book_append_sheet(wb, ws, '지원자명단템플릿');
      XLSX.writeFile(wb, '채용_지원자_등록_템플릿.xlsx');
    },

    importExcel(file, callback) {
      if (typeof XLSX === 'undefined') return;
      const proj = getActiveProject();

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(worksheet);

          if (json && json.length > 0) {
            const imported = [];
            json.forEach((row, idx) => {
              const no = row['수험번호'] || row['candidateNo'] || `A-2026-EX${idx+1}`;
              const name = row['성명'] || row['name'] || `지원자${idx+1}`;
              const birth = row['생년월일'] || row['birth'] || '';
              const phone = row['연락처'] || row['phone'] || '';
              const bonusRuleId = row['가산점구분'] || row['bonusRuleId'] || 'none';

              imported.push({
                id: 'c_ex_' + idx + '_' + Date.now(),
                candidateNo: String(no),
                name: String(name),
                birth: String(birth),
                phone: String(phone),
                bonusRuleId: String(bonusRuleId)
              });
            });

            if (confirm(`${imported.length}명의 지원자 데이터를 임포트하시겠습니까?`)) {
              proj.candidates = imported;
              saveState();
              if (callback) callback();
              alert('엑셀 데이터 임포트가 완료되었습니다.');
            }
          }
        } catch (err) {
          alert('엑셀 임포트 중 오류가 발생했습니다: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // ==========================================
  // 5. Dedicated Evaluator Smart App Controller (evaluator.html)
  // ==========================================
  const EvaluatorApp = {
    currentStage: 'doc',
    currentEvaluatorId: '',
    activeCandidateIndex: 0,
    isDrawing: false,

    init() {
      const stageSelect = document.getElementById('eval-app-stage');
      if (!stageSelect) return;

      loadState();
      const proj = getActiveProject();

      const jobTitleEl = document.getElementById('eval-header-job-title');
      if (jobTitleEl) jobTitleEl.textContent = proj.jobTitle;

      this.currentStage = stageSelect.value || 'doc';

      this.bindControls();
      this.initSignatureCanvas();
      this.renderEvaluatorSelect();
      this.renderCandidateSelectCombobox();
      this.renderCandidateChips();
      this.renderCurrentCandidateCard();

      if (window.lucide) window.lucide.createIcons();
    },

    bindControls() {
      const stageSelect = document.getElementById('eval-app-stage');
      if (stageSelect) {
        stageSelect.addEventListener('change', (e) => {
          this.currentStage = e.target.value;
          const scaleTextEl = document.getElementById('eval-scale-mode-text');
          if (scaleTextEl) {
            scaleTextEl.textContent = this.currentStage === 'interview' 
              ? '면접전형 5점 척도: 5(매우우수) ~ 1(매우미흡)' 
              : '서류전형 5점 척도: 5(매우우수) ~ 1(매우미흡)';
          }
          this.renderEvaluatorSelect();
          this.renderCandidateSelectCombobox();
          this.renderCandidateChips();
          this.renderCurrentCandidateCard();
        });
      }

      const evalSelect = document.getElementById('eval-app-evaluator');
      if (evalSelect) {
        evalSelect.addEventListener('change', (e) => {
          this.currentEvaluatorId = e.target.value;
          this.renderCandidateSelectCombobox();
          this.renderCandidateChips();
          this.renderCurrentCandidateCard();
        });
      }

      const candCombobox = document.getElementById('eval-candidate-select');
      if (candCombobox) {
        candCombobox.addEventListener('change', (e) => {
          this.activeCandidateIndex = Number(e.target.value);
          this.renderCandidateChips();
          this.renderCurrentCandidateCard();
        });
      }

      const btnPrev = document.getElementById('btn-prev-cand');
      if (btnPrev) {
        btnPrev.addEventListener('click', () => {
          if (this.activeCandidateIndex > 0) {
            this.activeCandidateIndex--;
            this.renderCandidateSelectCombobox();
            this.renderCandidateChips();
            this.renderCurrentCandidateCard();
          }
        });
      }

      const btnNext = document.getElementById('btn-next-cand');
      if (btnNext) {
        btnNext.addEventListener('click', () => {
          const proj = getActiveProject();
          if (this.activeCandidateIndex < proj.candidates.length - 1) {
            this.activeCandidateIndex++;
            this.renderCandidateSelectCombobox();
            this.renderCandidateChips();
            this.renderCurrentCandidateCard();
          }
        });
      }

      const btnRubric = document.getElementById('btn-view-rubric-modal');
      if (btnRubric) {
        btnRubric.addEventListener('click', () => {
          this.openRubricModal();
        });
      }

      const btnCloseRubric = document.getElementById('btn-close-rubric-modal');
      if (btnCloseRubric) {
        btnCloseRubric.addEventListener('click', () => {
          document.getElementById('modal-rubric-guide').classList.remove('active');
        });
      }

      const btnConfirmRubric = document.getElementById('btn-confirm-rubric-modal');
      if (btnConfirmRubric) {
        btnConfirmRubric.addEventListener('click', () => {
          document.getElementById('modal-rubric-guide').classList.remove('active');
        });
      }

      const btnSubmit = document.getElementById('btn-submit-eval-app');
      if (btnSubmit) {
        btnSubmit.addEventListener('click', () => {
          const proj = getActiveProject();
          const audit = EvaluationEngine.runSystemAudit();
          if (audit.missingCount > 0) {
            if (!confirm(`주의: 아직 채점하지 않은 수기 항목이 ${audit.missingCount}건 남아있습니다. 이대로 제출하시겠습니까?`)) {
              return;
            }
          }
          alert(`'${proj.jobTitle}' 위원 평가 채점표 및 전자서명이 성공적으로 제출되었습니다.`);
        });
      }
    },

    openRubricModal() {
      const proj = getActiveProject();
      const criteria = (this.currentStage === 'doc' ? proj.docCriteria : proj.interviewCriteria) || defaultCriteria[this.currentStage];
      const stageTitle = this.currentStage === 'doc' ? '서류전형 5점 척도 루브릭 가이드' : '면접전형 5점 척도 루브릭 가이드';

      const body = document.getElementById('rubric-guide-body');
      let html = `<h4 class="margin-bottom-sm text-primary">${stageTitle}</h4><div class="criteria-list">`;

      criteria.forEach(item => {
        html += `
          <div class="criteria-item">
            <div>
              <div class="criteria-name">${item.name}</div>
              <div class="criteria-desc">${item.desc}</div>
            </div>
            <div class="criteria-score">5점 만점</div>
          </div>
        `;
      });
      html += '</div>';
      body.innerHTML = html;
      document.getElementById('modal-rubric-guide').classList.add('active');
    },

    renderEvaluatorSelect() {
      const proj = getActiveProject();
      const select = document.getElementById('eval-app-evaluator');
      if (!select) return;
      select.innerHTML = '';

      let evaluators = this.currentStage === 'doc' ? proj.docEvaluators : proj.interviewEvaluators;
      if (!evaluators || evaluators.length === 0) {
        evaluators = this.currentStage === 'doc'
          ? [{ id: 'doc_ev1', name: '서류위원 A (내부)', role: '인사팀장' }, { id: 'doc_ev2', name: '서류위원 B (외부)', role: '외부 인사전문가' }]
          : [{ id: 'int_ev1', name: '면접위원 1 (위원장)', role: '평가위원장' }, { id: 'int_ev2', name: '면접위원 2', role: '면접평가위원' }];
        if (this.currentStage === 'doc') proj.docEvaluators = evaluators;
        else proj.interviewEvaluators = evaluators;
      }

      evaluators.forEach(ev => {
        const opt = document.createElement('option');
        opt.value = ev.id;
        opt.textContent = `${ev.name} (${ev.role})`;
        select.appendChild(opt);
      });

      if (!evaluators.some(e => e.id === this.currentEvaluatorId)) {
        this.currentEvaluatorId = evaluators[0].id;
      }
      select.value = this.currentEvaluatorId;
    },

    renderCandidateSelectCombobox() {
      const proj = getActiveProject();
      const select = document.getElementById('eval-candidate-select');
      if (!select) return;
      select.innerHTML = '';

      if (!proj.candidates || proj.candidates.length === 0) {
        const opt = document.createElement('option');
        opt.value = 0;
        opt.textContent = '(등록된 응시자 없음)';
        select.appendChild(opt);
        return;
      }

      proj.candidates.forEach((cand, idx) => {
        const att = EvaluationEngine.getAttendance(this.currentStage, this.currentEvaluatorId, cand.id);
        const { isComplete } = EvaluationEngine.getEvaluatorSum(this.currentStage, this.currentEvaluatorId, cand.id);
        
        let statusTag = '';
        if (att === 'absent') statusTag = ' [불참]';
        else if (isComplete) statusTag = ' [완료✓]';

        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${cand.candidateNo} ${cand.name}${statusTag}`;
        if (idx === this.activeCandidateIndex) opt.selected = true;
        select.appendChild(opt);
      });

      select.value = this.activeCandidateIndex;
    },

    renderCandidateChips() {
      const proj = getActiveProject();
      const container = document.getElementById('cand-chip-container');
      if (!container) return;
      container.innerHTML = '';

      let doneCount = 0;

      proj.candidates.forEach((cand, idx) => {
        const att = EvaluationEngine.getAttendance(this.currentStage, this.currentEvaluatorId, cand.id);
        const { isComplete } = EvaluationEngine.getEvaluatorSum(this.currentStage, this.currentEvaluatorId, cand.id);
        if (isComplete) doneCount++;

        const chip = document.createElement('div');
        const isAbsent = att === 'absent';

        chip.className = `cand-chip ${idx === this.activeCandidateIndex ? 'active' : ''} ${isComplete ? 'done' : ''} ${isAbsent ? 'absent-chip' : ''}`;
        chip.innerHTML = `
          <span>${cand.candidateNo} ${cand.name}${isAbsent ? ' (불참)' : ''}</span>
          ${isAbsent ? '<i data-lucide="x" style="width:14px; color:#ef4444;"></i>' : (isComplete ? '<i data-lucide="check" style="width:14px;"></i>' : '')}
        `;

        chip.addEventListener('click', () => {
          this.activeCandidateIndex = idx;
          this.renderCandidateSelectCombobox();
          this.renderCandidateChips();
          this.renderCurrentCandidateCard();
        });

        container.appendChild(chip);
      });

      const totalCandEl = document.getElementById('submit-total-cand');
      if (totalCandEl) totalCandEl.textContent = proj.candidates.length;

      const descEl = document.getElementById('submit-check-desc');
      if (descEl) {
        if (doneCount === proj.candidates.length && proj.candidates.length > 0) {
          descEl.innerHTML = `<span class="text-success"><i data-lucide="check-circle"></i> 모든 지원자(${doneCount}명) 채점 및 불참 처리가 완료되었습니다.</span>`;
        } else {
          descEl.innerHTML = `<span class="text-sub">총 ${proj.candidates.length}명 중 <strong>${doneCount}명</strong> 검토 완료 (남은 지원자 ${proj.candidates.length - doneCount}명)</span>`;
        }
      }
      if (window.lucide) window.lucide.createIcons();
    },

    renderCurrentCandidateCard() {
      const proj = getActiveProject();
      const formContainer = document.getElementById('rubric-form-container');
      if (!formContainer) return;

      if (!proj.candidates || proj.candidates.length === 0) {
        const nameTitleEl = document.getElementById('cand-name-title');
        if (nameTitleEl) nameTitleEl.textContent = '등록된 지원자가 없습니다';
        formContainer.innerHTML = '<div class="alert alert-info">등록된 지원자가 없습니다. 관리자 화면에서 지원자를 추가해주세요.</div>';
        return;
      }

      const cand = proj.candidates[this.activeCandidateIndex] || proj.candidates[0];
      const noBadgeEl = document.getElementById('cand-no-badge');
      const nameTitleEl = document.getElementById('cand-name-title');
      const birthTextEl = document.getElementById('cand-birth-text');

      if (noBadgeEl) noBadgeEl.textContent = cand.candidateNo;
      if (nameTitleEl) nameTitleEl.textContent = `${cand.name} 지원자`;
      if (birthTextEl) birthTextEl.textContent = cand.birth || '-';

      const btnPresent = document.getElementById('btn-attend-present');
      const btnAbsent = document.getElementById('btn-attend-absent');
      const currentAtt = EvaluationEngine.getAttendance(this.currentStage, this.currentEvaluatorId, cand.id);

      if (btnPresent && btnAbsent) {
        if (currentAtt === 'absent') {
          btnPresent.className = 'btn btn-sm btn-outline-success';
          btnAbsent.className = 'btn btn-sm btn-danger active';
        } else {
          btnPresent.className = 'btn btn-sm btn-success active';
          btnAbsent.className = 'btn btn-sm btn-outline-danger';
        }

        btnPresent.onclick = () => {
          EvaluationEngine.setAttendance(this.currentStage, this.currentEvaluatorId, cand.id, 'present');
          this.renderCandidateSelectCombobox();
          this.renderCandidateChips();
          this.renderCurrentCandidateCard();
        };

        btnAbsent.onclick = () => {
          EvaluationEngine.setAttendance(this.currentStage, this.currentEvaluatorId, cand.id, 'absent');
          this.renderCandidateSelectCombobox();
          this.renderCandidateChips();
          this.renderCurrentCandidateCard();
        };
      }

      if (currentAtt === 'absent') {
        formContainer.innerHTML = `
          <div class="alert alert-danger" style="background:#fef2f2; border:2px solid #fca5a5; border-radius:12px; padding:2.5rem 1.5rem; text-align:center;">
            <i data-lucide="user-x" style="width:48px; height:48px; color:#dc2626; margin-bottom:0.75rem;"></i>
            <h3 style="color:#991b1b; font-weight:800; font-size:1.3rem; margin-bottom:0.4rem;">해당 응시자는 '불참 (결시)' 처리되었습니다</h3>
            <p style="color:#b91c1c; font-size:0.95rem; margin:0;">
              항목별 점수를 별도 부여하지 않으며, 전형 결과는 불참 (0점 과락) 처리됩니다.
            </p>
          </div>
        `;
        this.updateCandidateTotalScore(cand.id);
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      let criteria = (this.currentStage === 'doc' ? proj.docCriteria : proj.interviewCriteria);
      if (!criteria || criteria.length === 0) {
        criteria = defaultCriteria[this.currentStage];
        if (this.currentStage === 'doc') proj.docCriteria = criteria;
        else proj.interviewCriteria = criteria;
      }

      formContainer.innerHTML = '';

      criteria.forEach((crit, critIdx) => {
        const scoreVal = EvaluationEngine.getScore(this.currentStage, this.currentEvaluatorId, cand.id, crit.id);

        const card = document.createElement('div');
        card.className = 'score-item-card';

        card.innerHTML = `
          <div class="score-item-header">
            <div>
              <div class="score-item-title">${critIdx + 1}. ${crit.name}</div>
              <div class="score-item-desc">${crit.desc}</div>
            </div>
            <span class="score-max-badge">5점 만점</span>
          </div>

          <div class="likert-btn-group">
            <div class="btn-likert ${scoreVal === 5 ? 'selected' : ''}" data-val="5">
              <div class="likert-score">5점</div>
              <div class="likert-label">매우우수</div>
            </div>
            <div class="btn-likert ${scoreVal === 4 ? 'selected' : ''}" data-val="4">
              <div class="likert-score">4점</div>
              <div class="likert-label">우수</div>
            </div>
            <div class="btn-likert ${scoreVal === 3 ? 'selected' : ''}" data-val="3">
              <div class="likert-score">3점</div>
              <div class="likert-label">보통</div>
            </div>
            <div class="btn-likert ${scoreVal === 2 ? 'selected' : ''}" data-val="2">
              <div class="likert-score">2점</div>
              <div class="likert-label">미흡</div>
            </div>
            <div class="btn-likert ${scoreVal === 1 ? 'selected' : ''}" data-val="1">
              <div class="likert-score">1점</div>
              <div class="likert-label">매우미흡</div>
            </div>
          </div>
        `;

        card.querySelectorAll('.btn-likert').forEach(btn => {
          btn.addEventListener('click', () => {
            const val = Number(btn.getAttribute('data-val'));
            if (!proj.scores[this.currentStage]) proj.scores[this.currentStage] = {};
            if (!proj.scores[this.currentStage][this.currentEvaluatorId]) proj.scores[this.currentStage][this.currentEvaluatorId] = {};
            if (!proj.scores[this.currentStage][this.currentEvaluatorId][cand.id]) proj.scores[this.currentStage][this.currentEvaluatorId][cand.id] = {};

            proj.scores[this.currentStage][this.currentEvaluatorId][cand.id][crit.id] = val;
            saveState();

            card.querySelectorAll('.btn-likert').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            this.renderCandidateSelectCombobox();
            this.renderCandidateChips();
            this.updateCandidateTotalScore(cand.id);
          });
        });

        formContainer.appendChild(card);
      });

      this.updateCandidateTotalScore(cand.id);
    },

    updateCandidateTotalScore(candidateId) {
      const res = EvaluationEngine.getEvaluatorSum(this.currentStage, this.currentEvaluatorId, candidateId);
      const scoreTotalEl = document.getElementById('bottom-score-total');
      const scoreMaxEl = document.getElementById('bottom-score-max');

      if (res.isAbsent) {
        if (scoreTotalEl) {
          scoreTotalEl.textContent = '불참 (0점)';
          scoreTotalEl.style.color = '#ef4444';
        }
        if (scoreMaxEl) scoreMaxEl.textContent = '/ 결시 처리 (점수 미부여)';
      } else {
        if (scoreTotalEl) {
          scoreTotalEl.textContent = `${res.rawTotal}점`;
          scoreTotalEl.style.color = '#2563eb';
        }
        if (scoreMaxEl) scoreMaxEl.textContent = `/ ${res.maxPossibleRaw}점 만점 (${res.convertedTotal}점 환산)`;
      }
    },

    initSignatureCanvas() {
      const canvas = document.getElementById('sig-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const startDrawing = (e) => {
        this.isDrawing = true;
        ctx.beginPath();
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.moveTo(x, y);
      };

      const draw = (e) => {
        if (!this.isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0f172a';
        ctx.lineTo(x, y);
        ctx.stroke();
      };

      const stopDrawing = () => {
        this.isDrawing = false;
      };

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw);
      canvas.addEventListener('touchend', stopDrawing);

      const btnClear = document.getElementById('btn-clear-sig');
      if (btnClear) {
        btnClear.addEventListener('click', () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
      }
    }
  };

  window.EvaluatorApp = EvaluatorApp;

  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    UIRenderer.init();
  });

})();
