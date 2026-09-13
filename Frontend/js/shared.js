/* ============================================================
   NEXLAS AI — SHARED CODE
   State, toast, chat widget, cross-page persistence.
   Include via <script src="...shared.js"> BEFORE each page's
   own script so those scripts can use state / toast / etc.
============================================================ */

/* ============================================================
   STATE
============================================================ */
const state = {
  story: '', education: '', field: '', status: '',
  experience: new Set(), skills: new Set(), skillConfirmed: null,
  interests: new Set(), goal: '',
  timeAvailable: '', learningStyle: ''
};
let currentStep = 1;
let maxUnlocked = 1;
const TOTAL_STEPS = 15;
const STEP_LABELS = [
  'Welcome', 'Tell Us About Yourself', 'Education', 'Experience',
  'Skills Discovery', 'Interests', 'Career Goal', 'Time Available',
  'Learning Style', 'AI Analysis', 'Career Diagnosis',
  'What You Have vs Need', 'Career Readiness', 'Personalized Path', 'Next Step'
];

/* ============================================================
   SHARED APP DATA / IN-MEMORY STORES
============================================================ */
const appData = {
  roadmapDone: new Set(),
  learningDone: new Set(),
  learningFilter: 'All',
  mentorFilter: 'All',
  sessions: []
};

/* ============================================================
   TOAST
============================================================ */
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ============================================================
   AUTH UI (shared across all pages)
   - #signInBtn : top-right Sign In button (shown when logged out)
   - #logoutBtn : bottom-left Log Out button (shown when logged in)
   - #userChip  : user profile chip in the topbar (real session data)
   Requires: api.js loaded before this file.
============================================================ */
function applyAuthUI() {
  const session = API.getSession();
  const signInBtn = document.getElementById('signInBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userChip  = document.getElementById('userChip');

  if (session) {
    if (signInBtn) signInBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userChip) {
      userChip.style.display = 'flex';
      const name = userChip.querySelector('.txt b');
      const mail = userChip.querySelector('.txt span');
      const av   = userChip.querySelector('.av.user');
      if (name) name.textContent = session.name;
      if (mail) mail.textContent = session.email;
      if (av) av.textContent = (session.name || '').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    }
  } else {
    if (signInBtn) signInBtn.style.display = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userChip) userChip.style.display = 'none';
  }
}

function logout() {
  API.clearSession();
  clearAllNexlasStorage();
  const inPages = window.location.pathname.indexOf('/pages/') !== -1;
  window.location.href = (inPages ? '../index.html' : 'index.html');
}
applyAuthUI();

/* ============================================================
   CROSS-PAGE STORAGE  (user-scoped)
   Data is keyed per user ID so switching accounts never leaks
   state from one user to another.
============================================================ */
function _storageKey(base) {
  const session = API.getSession();
  const uid = session ? session.id : 'anon';
  return base + '_' + uid;
}
function saveProjectData() {
  try {
    localStorage.setItem(_storageKey('nexlasState'), JSON.stringify({
      story: state.story, education: state.education, field: state.field,
      status: state.status, experience: [...state.experience],
      skills: [...state.skills], skillConfirmed: state.skillConfirmed,
      interests: [...state.interests], goal: state.goal,
      timeAvailable: state.timeAvailable, learningStyle: state.learningStyle,
      currentStep, maxUnlocked
    }));
    localStorage.setItem(_storageKey('nexlasAppData'), JSON.stringify({
      roadmapDone: [...appData.roadmapDone],
      learningDone: [...appData.learningDone],
      learningFilter: appData.learningFilter,
      mentorFilter: appData.mentorFilter,
      sessions: appData.sessions
    }));
  } catch (e) { /* ignore */ }
}
function loadProjectData() {
  try {
    const s = JSON.parse(localStorage.getItem(_storageKey('nexlasState')) || 'null');
    if (s) {
      Object.assign(state, {
        story: s.story || '', education: s.education || '',
        field: s.field || '', status: s.status || '',
        skillConfirmed: s.skillConfirmed ?? null, goal: s.goal || '',
        timeAvailable: s.timeAvailable || '', learningStyle: s.learningStyle || ''
      });
      state.experience = new Set(s.experience || []);
      state.skills = new Set(s.skills || []);
      state.interests = new Set(s.interests || []);
      currentStep = s.currentStep || 1;
      maxUnlocked = s.maxUnlocked || 1;
    }
    const a = JSON.parse(localStorage.getItem(_storageKey('nexlasAppData')) || 'null');
    if (a) {
      appData.roadmapDone = new Set(a.roadmapDone || []);
      appData.learningDone = new Set(a.learningDone || []);
      Object.assign(appData, {
        learningFilter: a.learningFilter || 'All',
        mentorFilter: a.mentorFilter || 'All',
        sessions: a.sessions || []
      });
    }
  } catch (e) { /* ignore */ }
}
/** Clear ALL nexlas-related localStorage keys (called on logout / new login).
 *  NOTE: 'nexlasWizard_<uid>' keys are intentionally NOT cleared here so that
 *  a completed diagnostic can be restored after re-login on the same browser. */
function clearAllNexlasStorage() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('nexlasState') || k.startsWith('nexlasAppData'))) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

/* ============================================================
   PERSISTENT WIZARD STATE  (survives login / logout)
   Keyed per user so switching accounts never leaks state.
   Uses the 'nexlasWizard_' prefix which clearAllNexlasStorage
   intentionally ignores.
============================================================ */
function saveWizardPersistent() {
  const uid = API.getUserId() || 'anon';
  try {
    localStorage.setItem('nexlasWizard_' + uid, JSON.stringify({
      story: state.story, education: state.education, field: state.field,
      status: state.status, experience: [...state.experience],
      skills: [...state.skills], skillConfirmed: state.skillConfirmed,
      interests: [...state.interests], goal: state.goal,
      timeAvailable: state.timeAvailable, learningStyle: state.learningStyle,
      currentStep, maxUnlocked
    }));
  } catch (e) { /* ignore */ }
}
function loadWizardPersistent() {
  const uid = API.getUserId();
  if (!uid) return false;
  try {
    const raw = localStorage.getItem('nexlasWizard_' + uid);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s) return false;
    Object.assign(state, {
      story: s.story || '', education: s.education || '',
      field: s.field || '', status: s.status || '',
      skillConfirmed: s.skillConfirmed ?? null, goal: s.goal || '',
      timeAvailable: s.timeAvailable || '', learningStyle: s.learningStyle || ''
    });
    state.experience = new Set(s.experience || []);
    state.skills = new Set(s.skills || []);
    state.interests = new Set(s.interests || []);
    currentStep = s.currentStep || 1;
    maxUnlocked = s.maxUnlocked || 1;
    return true;
  } catch (e) { return false; }
}
function clearWizardPersistent() {
  const uid = API.getUserId();
  if (uid) localStorage.removeItem('nexlasWizard_' + uid);
}

/* ============================================================
   PERSISTENT PROGRESS STATE  (survives login / logout)
   Roadmap step completion + course completion.
   Uses 'nexlasProgress_' prefix which clearAllNexlasStorage
   intentionally ignores.
============================================================ */
function saveProgressPersistent() {
  const uid = API.getUserId() || 'anon';
  try {
    localStorage.setItem('nexlasProgress_' + uid, JSON.stringify({
      roadmapDone: [...appData.roadmapDone],
      learningDone: [...appData.learningDone]
    }));
  } catch (e) { /* ignore */ }
}
function loadProgressPersistent() {
  const uid = API.getUserId();
  if (!uid) return false;
  try {
    const raw = localStorage.getItem('nexlasProgress_' + uid);
    if (!raw) return false;
    const p = JSON.parse(raw);
    if (!p) return false;
    appData.roadmapDone = new Set(p.roadmapDone || []);
    appData.learningDone = new Set(p.learningDone || []);
    return true;
  } catch (e) { return false; }
}
loadProjectData();
window.addEventListener('beforeunload', saveProjectData);
