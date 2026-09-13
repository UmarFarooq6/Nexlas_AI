/* ============================================================
   NEXLAS AI — INDEX PAGE (Onboarding Wizard)
   Requires: api.js + shared.js loaded before this file.
============================================================ */

/* ============================================================
   STEPPER RENDER
============================================================ */
function renderStepper() {
  const wrap = document.getElementById('stepper');
  wrap.innerHTML = '';
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const node = document.createElement('div');
    node.className = 'step-node';
    let stateClass = '';
    if (i < currentStep) stateClass = 'done';
    if (i === currentStep) stateClass = 'active';
    if (stateClass) node.classList.add(stateClass);
    // Only allow clicking backward steps (already completed).
    // Forward navigation must use the Continue button.
    node.innerHTML = `<div class="connector"></div><div class="circle">${stateClass === 'done' ? '✓' : i}</div><div class="label">${STEP_LABELS[i - 1]}</div>`;
    if (i < currentStep) {
      node.classList.add('clickable');
      node.addEventListener('click', () => goStep(i));
    }
    wrap.appendChild(node);
  }
}

/* ============================================================
   NAVIGATION
============================================================ */
function goStep(n) {
  if (n > 9) return;
  document.querySelectorAll('.step-view[data-step]').forEach(el => {
    if (parseInt(el.dataset.step) <= 9) el.classList.remove('show');
  });
  const target = document.querySelector('.step-view[data-step="' + n + '"]');
  if (target) target.classList.add('show');
  currentStep = n;
  if (n > maxUnlocked) maxUnlocked = n;
  renderStepper();
  document.getElementById('wizardPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function skipToGoal() {
  state.education = state.education || "Bachelor's in progress";
  state.status = state.status || 'Student';
  maxUnlocked = 7;
  goStep(7);
  toast('Great — let\'s jump straight to your career goal!');
}

/* ============================================================
   STEP 2 — STORY
============================================================ */
function onStoryInput() {
  const v = document.getElementById('storyInput').value;
  state.story = v;
  document.getElementById('storyCount').textContent = v.length + ' chars';
  document.getElementById('btnStep2').disabled = v.trim().length < 15;
  document.getElementById('storyHint').textContent = v.trim().length < 15 ? 'Write at least a couple of sentences.' : 'Perfect, thank you!';
}

/* ============================================================
   STEP 3 — EDUCATION
============================================================ */
document.getElementById('eduGrid')?.addEventListener('click', e => {
  const card = e.target.closest('.opt-card');
  if (!card) return;
  document.querySelectorAll('#eduGrid .opt-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  state.education = card.dataset.val;
  document.getElementById('eduFollowup').style.display = 'block';
  validateStep3();
});
document.getElementById('fieldInput')?.addEventListener('input', e => { state.field = e.target.value; validateStep3(); });
document.getElementById('statusChips')?.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#statusChips .chip').forEach(c => c.classList.remove('on'));
  chip.classList.add('on');
  state.status = chip.dataset.val;
  validateStep3();
});
function validateStep3() {
  document.getElementById('btnStep3').disabled = !(state.education && state.status);
}

/* ============================================================
   STEP 4 — EXPERIENCE
============================================================ */
document.getElementById('expGrid')?.addEventListener('click', e => {
  const card = e.target.closest('.opt-card');
  if (!card) return;
  const val = card.dataset.val;
  if (val === 'None yet') {
    document.querySelectorAll('#expGrid .opt-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.experience.clear();
    state.experience.add('None yet');
  } else {
    document.querySelector('#expGrid .opt-card[data-val="None yet"]').classList.remove('selected');
    state.experience.delete('None yet');
    card.classList.toggle('selected');
    if (card.classList.contains('selected')) state.experience.add(val);
    else state.experience.delete(val);
  }
  document.getElementById('btnStep4').disabled = state.experience.size === 0;
});

/* ============================================================
   STEP 5 — SKILLS
============================================================ */
const SUGGESTED_SKILLS = [
  'SQL', 'Excel', 'Python', 'Data Visualization', 'Statistics',
  'JavaScript', 'React', 'CSS', 'HTML', 'Git',
  'Figma', 'Wireframing', 'User Research', 'Design Systems',
  'SEO', 'Content Strategy', 'Google Analytics', 'Social Media Ads',
  'Copywriting', 'Machine Learning'
];

function renderSuggestSkills() {
  const wrap = document.getElementById('suggestSkillChips');
  wrap.innerHTML = '';
  SUGGESTED_SKILLS.forEach(s => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (state.skills.has(s) ? ' on' : '');
    chip.textContent = s;
    chip.onclick = () => { toggleSkill(s); };
    wrap.appendChild(chip);
  });
}
function toggleSkill(s) {
  if (state.skills.has(s)) state.skills.delete(s); else state.skills.add(s);
  renderSuggestSkills();
  renderSelectedSkills();
  validateStep5();
}
function addSkillFromInput() {
  const input = document.getElementById('skillInput');
  const v = input.value.trim();
  if (!v) return;
  state.skills.add(v);
  input.value = '';
  renderSuggestSkills();
  renderSelectedSkills();
  validateStep5();
}
function renderSelectedSkills() {
  const wrap = document.getElementById('selectedSkillChips');
  wrap.innerHTML = '';
  if (state.skills.size === 0) {
    wrap.innerHTML = '<span style="font-size:12px;color:var(--text-faint);">No skills added yet — add some above.</span>';
    return;
  }
  state.skills.forEach(s => {
    const chip = document.createElement('div');
    chip.className = 'chip on';
    chip.innerHTML = s + ' &nbsp;✕';
    chip.onclick = () => { state.skills.delete(s); renderSuggestSkills(); renderSelectedSkills(); validateStep5(); };
    wrap.appendChild(chip);
  });
}
function setSkillConfirm(val) {
  state.skillConfirmed = val;
  document.getElementById('skillYes').classList.toggle('on', val === true);
  document.getElementById('skillNo').classList.toggle('on', val === false);
  validateStep5();
}
function validateStep5() {
  document.getElementById('btnStep5').disabled = state.skills.size === 0;
}

/* ============================================================
   STEP 6 — INTERESTS
============================================================ */
document.getElementById('interestGrid')?.addEventListener('click', e => {
  const card = e.target.closest('.opt-card');
  if (!card) return;
  const val = card.dataset.val;
  if (card.classList.contains('selected')) {
    card.classList.remove('selected');
    state.interests.delete(val);
  } else {
    if (state.interests.size >= 3) { toast('You can select up to 3 interests.'); return; }
    card.classList.add('selected');
    state.interests.add(val);
  }
  document.getElementById('btnStep6').disabled = state.interests.size === 0;
});

/* ============================================================
   STEP 7 — GOAL
============================================================ */
function onGoalInput() {
  const v = document.getElementById('goalInput').value;
  state.goal = v;
  document.getElementById('btnStep7').disabled = v.trim().length < 10;
}

/* ============================================================
   STEP 8 — TIME AVAILABLE
============================================================ */
document.getElementById('timeChips')?.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#timeChips .chip').forEach(c => c.classList.remove('on'));
  chip.classList.add('on');
  state.timeAvailable = chip.dataset.val;
  document.getElementById('btnStep8').disabled = false;
});

/* ============================================================
   STEP 9 — LEARNING STYLE
============================================================ */
document.getElementById('learningStyleChips')?.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#learningStyleChips .chip').forEach(c => c.classList.remove('on'));
  chip.classList.add('on');
  state.learningStyle = chip.dataset.val;
  document.getElementById('btnStep9').disabled = false;
});

/* ============================================================
   ANALYSIS LOADING SEQUENCE
============================================================ */
const ANALYSIS_STEPS = [
  'Understanding your background',
  'Analyzing your experience',
  'Mapping your interests',
  'Evaluating your career goal',
  'Identifying skill gaps',
  'Finding relevant opportunities',
  'Building your personalized roadmap',
  'Finalizing your diagnosis'
];

function mapExperienceToYears() {
  const exp = [...state.experience];
  if (exp.includes('None yet')) return 'None';
  if (exp.includes('Work Experience')) return '1-3 years';
  if (exp.length >= 2) return '1-3 years';
  return 'Less than 1 year';
}

async function submitToBackend() {
  const userId = API.getUserId();
  if (!userId) throw new Error('Please log in first — redirecting to login.');

  const answers = [
    { question_id: 'education_level', answer: state.education },
    { question_id: 'education_field', answer: state.field || 'Not specified' },
    { question_id: 'experience_years', answer: mapExperienceToYears() },
    { question_id: 'skills', answer: [...state.skills] },
    { question_id: 'interests', answer: [...state.interests] },
    { question_id: 'career_goal', answer: state.goal },
    { question_id: 'time_available', answer: state.timeAvailable || '5-10hrs' },
    { question_id: 'learning_style', answer: state.learningStyle || 'Hands-on' },
  ];

  return API.submitAnswers(userId, answers);
}

async function runAnalysis() {
  // Hide wizard steps, show loading panel
  document.querySelectorAll('.step-view[data-step]').forEach(el => {
    if (parseInt(el.dataset.step) <= 9) el.classList.remove('show');
  });
  document.getElementById('analysisPanel').classList.add('show');
  currentStep = 10; maxUnlocked = 10;
  renderStepper();

  const list = document.getElementById('analysisList');
  list.innerHTML = '';
  ANALYSIS_STEPS.forEach((s, i) => {
    const item = document.createElement('div');
    item.className = 'analysis-item';
    item.id = 'ai-' + i;
    item.innerHTML = `<div class="dot"></div><span>${s}</span>`;
    list.appendChild(item);
  });

  // Animate loading steps
  let idx = 0;
  const fill = document.getElementById('progressFill');
  function animStep() {
    if (idx > 0) {
      const prev = document.getElementById('ai-' + (idx - 1));
      prev.classList.remove('active'); prev.classList.add('done');
      prev.querySelector('.dot').textContent = '✓';
    }
    if (idx < ANALYSIS_STEPS.length) {
      const cur = document.getElementById('ai-' + idx);
      cur.classList.add('active');
      fill.style.width = Math.round(((idx + 1) / ANALYSIS_STEPS.length) * 100) + '%';
      idx++;
      setTimeout(animStep, 480);
    }
  }
  animStep();

  // Submit to backend and fetch results
  try {
    await submitToBackend();
    const userId = API.getUserId();
    // Roadmap first: it persists the career pick, so the recommendation fetched
    // right after is guaranteed to agree with it (no two independent AI picks).
    const roadmap = await API.getRoadmap(userId).catch(() => null);
    const recs = await API.getRecommendations(userId);

    // Wait for animation to finish (~4s)
    const elapsed = idx * 480;
    const remaining = Math.max(500, elapsed + 500 - Date.now());
    await new Promise(r => setTimeout(r, Math.max(remaining, 800)));

    showResults(recs, roadmap);
  } catch (err) {
    toast('Error: ' + err.message);
    document.getElementById('analysisPanel').classList.remove('show');
    if (err.message.toLowerCase().includes('log in')) {
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      return;
    }
    goStep(7);
  }
}

/* ============================================================
   SHOW RESULTS (from backend data)
============================================================ */
function showResults(recs, roadmap) {
  currentStep = 15; maxUnlocked = 15;
  renderStepper();

  // Analysis recap
  document.getElementById('analysisRecap').innerHTML = ANALYSIS_STEPS.map(s =>
    `<div class="mini-check"><span class="ok">✓</span>${s}</div>`).join('');

  // Have / Need (from backend skill gaps)
  const haveSkills = recs.skill_gaps.filter(g => g.current_level > 0).map(g => g.skill);
  const needSkills = recs.skill_gaps.filter(g => g.gap > 0).map(g => g.skill);

  document.getElementById('haveList').innerHTML = haveSkills.length
    ? haveSkills.map(s => `<div class="hv-item have"><span class="b">✓</span>${s}</div>`).join('')
    : '<div class="hv-item have"><span class="b">✓</span>Great potential to build from scratch</div>';
  document.getElementById('needList').innerHTML = needSkills.length
    ? needSkills.map(s => `<div class="hv-item need"><span class="b">!</span>${s}</div>`).join('')
    : '<div class="hv-item need"><span class="b">✓</span>You cover all key skills!</div>';

  // Career match ring
  const matchPct = Math.round(recs.fit_score);
  const careerIcons = {
    'Data Analyst': '📊', 'Frontend Developer': '💻', 'UI/UX Designer': '🎨',
    'Digital Marketing Specialist': '📣', 'Data Scientist': '🤖'
  };
  const icon = careerIcons[recs.career_title] || '🎯';
  document.getElementById('matchRole').textContent = icon + ' ' + recs.career_title;
  document.getElementById('matchPct').textContent = matchPct + '%';
  const circumference = 2 * Math.PI * 30;
  const ring = document.getElementById('matchRing');
  ring.setAttribute('stroke-dasharray', circumference);
  setTimeout(() => { ring.style.strokeDashoffset = circumference - (matchPct / 100) * circumference; }, 100);

  // Reasons
  const reasons = [];
  reasons.push(`Your interests align strongly with the <b>${recs.career_title}</b> career path.`);
  if (haveSkills.length > 0) reasons.push(`You already show strength in <b>${haveSkills.slice(0, 3).join(', ')}</b>.`);
  if (state.experience.size > 0 && !state.experience.has('None yet')) {
    reasons.push(`Your background in <b>${[...state.experience].join(', ')}</b> gives you a practical head start.`);
  }
  reasons.push(`Based on your goal — "${state.goal.slice(0, 60)}${state.goal.length > 60 ? '...' : ''}" — this path fits your ambition.`);
  document.getElementById('reasonList').innerHTML = reasons.map(r => `<li>${r}</li>`).join('');

  // Readiness gauge (using fit_score)
  const overall = matchPct;
  const gCirc = 2 * Math.PI * 36;
  const gRing = document.getElementById('gaugeRing');
  gRing.setAttribute('stroke-dasharray', gCirc);
  setTimeout(() => { gRing.style.strokeDashoffset = gCirc - (overall / 100) * gCirc; }, 150);
  document.getElementById('gaugeVal').textContent = overall;
  document.getElementById('gaugeMsg').textContent = overall >= 70
    ? 'You\'re well prepared — keep building momentum!'
    : overall >= 45 ? 'You\'re on the right track — a few gaps to close.' : 'Early stage — let\'s build your foundation step by step.';

  // Readiness bars (from backend skill gaps)
  function priorityFor(pct) {
    return pct >= 65 ? { c: 'low', t: 'On Track' } : pct >= 40 ? { c: 'med', t: 'Medium Priority' } : { c: 'high', t: 'High Priority' };
  }
  const bars = recs.skill_gaps.map(g => {
    const pct = g.required_level > 0 ? Math.round((g.current_level / g.required_level) * 100) : 100;
    const p = priorityFor(pct);
    return { label: g.skill, pct, p };
  });
  document.getElementById('readinessBars').innerHTML = bars.map(({ label, pct, p }) =>
    `<div class="bar-row">
      <div class="top"><span>${label}</span><span><b>${pct}%</b> <span class="priority ${p.c}">${p.t}</span></span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;"></div></div>
    </div>`
  ).join('');

  // Timeline (from roadmap or generated)
  let tlItems;
  if (roadmap && roadmap.roadmap_steps) {
    const steps = roadmap.roadmap_steps;
    tlItems = [
      ['1', 'Month 1: ' + (steps.month1?.[0] || 'Build core skills'), 'Days 1–30'],
      ['2', 'Month 1: ' + (steps.month1?.[1] || 'Continue learning'), 'Days 1–30'],
      ['3', 'Month 2: ' + (steps.month2?.[0] || 'Intermediate skills'), 'Days 31–60'],
      ['4', 'Month 2: ' + (steps.month2?.[1] || 'Practice project'), 'Days 31–60'],
      ['5', 'Month 3: ' + (steps.month3?.[0] || 'Apply & portfolio'), 'Days 61–90'],
    ];
  } else {
    const scale = overall >= 70 ? 0.7 : overall >= 45 ? 1 : 1.4;
    tlItems = [
      ['1', 'Strengthen Core Skills', Math.round(14 * scale) + ' days'],
      ['2', 'Learn the Foundations', Math.round(21 * scale) + ' days'],
      ['3', 'Build Real Evidence', Math.round(18 * scale) + ' days'],
      ['4', 'Portfolio Ready', Math.round(10 * scale) + ' days'],
      ['5', 'Enter the Market', 'Ongoing'],
    ];
  }
  document.getElementById('timeline').innerHTML = tlItems.map(([n, t, s]) =>
    `<div class="tl-item">
      <div class="lane"><div class="dotn">${n}</div><div class="line"></div></div>
      <div class="body"><b>${t}</b><span>${s}</span></div>
    </div>`
  ).join('');

  // Show results panel
  document.getElementById('results').classList.add('show');
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  saveWizardPersistent();
  saveProjectData();
}

/* ============================================================
   RESTART
============================================================ */
function restartAll() {
  state.story = ''; state.education = ''; state.field = ''; state.status = '';
  state.experience.clear(); state.skills.clear(); state.skillConfirmed = null;
  state.interests.clear(); state.goal = '';
  state.timeAvailable = ''; state.learningStyle = '';
  document.getElementById('storyInput').value = '';
  document.getElementById('fieldInput').value = '';
  document.getElementById('goalInput').value = '';
  document.querySelectorAll('.opt-card.selected').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.chip.on').forEach(c => c.classList.remove('on'));
  document.getElementById('eduFollowup').style.display = 'none';
  renderSuggestSkills(); renderSelectedSkills();
  ['btnStep2', 'btnStep3', 'btnStep4', 'btnStep5', 'btnStep6', 'btnStep7', 'btnStep8', 'btnStep9'].forEach(
    id => { const el = document.getElementById(id); if (el) el.disabled = true; }
  );
  document.getElementById('analysisPanel').classList.remove('show');
  document.getElementById('results').classList.remove('show');
  currentStep = 1; maxUnlocked = 1;
  clearWizardPersistent();
  goStep(1);
  toast('Diagnosis reset — let\'s start fresh!');
}

/* ============================================================
   RESTORE WIZARD UI FROM STATE
   After loading state from persistent storage or backend,
   reflect all values in the DOM so the wizard looks filled in.
============================================================ */
function restoreWizardUI() {
  // Step 2 — Story
  const storyInput = document.getElementById('storyInput');
  if (storyInput && state.story) {
    storyInput.value = state.story;
    onStoryInput();
  }

  // Step 3 — Education
  if (state.education) {
    const eduCard = document.querySelector('#eduGrid .opt-card[data-val="' + state.education + '"]');
    if (eduCard) {
      eduCard.classList.add('selected');
      document.getElementById('eduFollowup').style.display = 'block';
      if (state.field) document.getElementById('fieldInput').value = state.field;
      if (state.status) {
        const statusChip = document.querySelector('#statusChips .chip[data-val="' + state.status + '"]');
        if (statusChip) statusChip.classList.add('on');
      }
      validateStep3();
    }
  }

  // Step 4 — Experience
  state.experience.forEach(val => {
    const card = document.querySelector('#expGrid .opt-card[data-val="' + val + '"]');
    if (card) card.classList.add('selected');
  });
  if (state.experience.size > 0) document.getElementById('btnStep4').disabled = false;

  // Step 5 — Skills
  renderSuggestSkills();
  renderSelectedSkills();
  if (state.skillConfirmed !== null) setSkillConfirm(state.skillConfirmed);
  if (state.skills.size > 0) document.getElementById('btnStep5').disabled = false;

  // Step 6 — Interests
  state.interests.forEach(val => {
    const card = document.querySelector('#interestGrid .opt-card[data-val="' + val + '"]');
    if (card) card.classList.add('selected');
  });
  if (state.interests.size > 0) document.getElementById('btnStep6').disabled = false;

  // Step 7 — Career Goal
  const goalInput = document.getElementById('goalInput');
  if (goalInput && state.goal) {
    goalInput.value = state.goal;
    onGoalInput();
  }

  // Step 8 — Time Available
  if (state.timeAvailable) {
    const timeChip = document.querySelector('#timeChips .chip[data-val="' + state.timeAvailable + '"]');
    if (timeChip) {
      timeChip.classList.add('on');
      document.getElementById('btnStep8').disabled = false;
    }
  }

  // Step 9 — Learning Style
  if (state.learningStyle) {
    const lsChip = document.querySelector('#learningStyleChips .chip[data-val="' + state.learningStyle + '"]');
    if (lsChip) {
      lsChip.classList.add('on');
      document.getElementById('btnStep9').disabled = false;
    }
  }
}

/* ============================================================
   PAGE INITIALIZATION
   Async: on load, check if the logged-in user already completed
   the diagnostic. If so, restore from persistent local cache
   (or backend fallback) and jump straight to results.
============================================================ */
async function initIndexPage() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === 'index'));
  renderSuggestSkills();
  renderSelectedSkills();
  renderStepper();

  const userId = API.getUserId();
  if (!userId) return; // not logged in — nothing to restore

  // If persistent local cache already has the data (same browser, same user), use it
  const hadLocal = loadWizardPersistent();
  if (hadLocal && currentStep >= 15) {
    restoreWizardUI();
    // Re-render stepper with restored step, then try to show results
    renderStepper();
    try {
      const roadmap = await API.getRoadmap(userId).catch(() => null);
      const recs = await API.getRecommendations(userId);
      showResults(recs, roadmap);
      return;
    } catch (e) { /* fall through to backend check */ }
  }

  // Otherwise check backend for a completed diagnostic
  try {
    const profile = await API.getProfile(userId);
    if (profile.diagnostic_status !== 'completed') {
      // Try restoring any partial progress from persistent cache
      if (hadLocal && currentStep > 1) { restoreWizardUI(); goStep(currentStep); }
      return;
    }

    // Map backend profile back into frontend state
    state.education = profile.education?.level || '';
    state.field = profile.education?.field || '';
    state.goal = profile.career_goal || '';
    state.skills = new Set((profile.skills || []).map(s => typeof s === 'string' ? s : s.skill));
    state.interests = new Set(profile.interests || []);
    state.timeAvailable = profile.constraints?.time_available || '';
    state.learningStyle = profile.constraints?.learning_style || '';

    // Experience: backend stores simplified years — map back to frontend labels
    const years = profile.experience?.years || 'None';
    if (years === 'None') state.experience = new Set(['None yet']);
    else if (years === 'Less than 1 year') state.experience = new Set(['Projects']);
    else state.experience = new Set(['Work Experience']);

    state.story = 'Previously completed diagnostic';
    state.status = 'Student';
    currentStep = 15;
    maxUnlocked = 15;

    // Persist so next login is instant from cache
    saveWizardPersistent();

    restoreWizardUI();
    renderStepper();

    // Fetch and display results
    const roadmap = await API.getRoadmap(userId).catch(() => null);
    const recs = await API.getRecommendations(userId);
    showResults(recs, roadmap);
  } catch (e) {
    // Backend unreachable — try local cache as last resort
    if (hadLocal && currentStep > 1) { restoreWizardUI(); goStep(currentStep); }
  }
}
initIndexPage();
