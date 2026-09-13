/* ============================================================
   NEXLAS AI — DASHBOARD PAGE
   Requires: api.js + shared.js loaded before this file.
============================================================ */

/* ---------- update user display from session ---------- */
function updateUserDisplay() {
  const session = API.getSession();
  if (!session) return;
  const userChips = document.querySelectorAll('.chip-profile .txt b');
  userChips.forEach(el => {
    if (el.textContent !== 'NexlasGPT') el.textContent = session.name;
  });
  const userSubs = document.querySelectorAll('.chip-profile .txt span');
  userSubs.forEach(el => {
    if (el.textContent !== 'Your AI Career Companion') el.textContent = session.email;
  });
  const initials = session.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.querySelectorAll('.chip-profile .av.user').forEach(el => { el.textContent = initials; });
}

/* ---------- DASHBOARD ---------- */
async function renderDashboard() {
  const gCirc = 2 * Math.PI * 36;
  const ring = document.getElementById('dashGaugeRing');
  ring.setAttribute('stroke-dasharray', gCirc);

  // Restore persistent progress so stats are accurate after re-login
  loadProgressPersistent();

  const userId = API.getUserId();
  if (!userId) {
    document.getElementById('dashGaugeMsg').textContent = 'Please log in to see your career diagnosis.';
    return;
  }

  try {
    const recs = await API.getRecommendations(userId);
    const val = Math.round(recs.fit_score);

    // Readiness gauge
    setTimeout(() => { ring.style.strokeDashoffset = gCirc - (val / 100) * gCirc; }, 100);
    document.getElementById('dashGaugeVal').textContent = val;
    document.getElementById('dashGaugeMsg').textContent = val >= 70
      ? 'You\'re well prepared — keep the momentum!'
      : val >= 45 ? 'Good progress — a few gaps left to close.' : 'Early stage — your roadmap will guide you.';

    // Career match
    const careerIcons = {
      'Data Analyst': '📊', 'Frontend Developer': '💻', 'UI/UX Designer': '🎨',
      'Digital Marketing Specialist': '📣', 'Data Scientist': '🤖'
    };
    const icon = careerIcons[recs.career_title] || '🎯';
    const matchBox = document.getElementById('dashMatchBox');
    matchBox.innerHTML = `<div style="font-size:28px;">${icon}</div>
      <div style="font-size:15px;font-weight:700;">${recs.career_title}</div>
      <div style="font-size:12px;color:var(--success);font-weight:700;">${val}% Match</div>`;

  } catch (err) {
    ring.style.strokeDashoffset = gCirc;
    document.getElementById('dashGaugeVal').textContent = '0';
    if (err.message.includes('No profile') || err.message.includes('not completed')) {
      document.getElementById('dashGaugeMsg').textContent = 'Complete your career diagnosis on NexlasGPT to see your score.';
    } else {
      document.getElementById('dashGaugeMsg').textContent = 'Could not load diagnosis: ' + err.message;
    }
  }

  // Stats from localStorage (progress tracking stays client-side for now)
  document.getElementById('statRoadmap').textContent = appData.roadmapDone.size;
  document.getElementById('statLearning').textContent = appData.learningDone.size;
}

/* ============================================================
   PAGE INITIALIZATION
============================================================ */
function initDashboardPage() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === 'dashboard'));
  updateUserDisplay();
  renderDashboard();
}
initDashboardPage();
