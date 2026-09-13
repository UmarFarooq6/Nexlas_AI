/* ============================================================
   NEXLAS AI — LEARNING PAGE
   Requires: api.js + shared.js loaded before this file.
============================================================ */

let COURSES = [];

/* ---------- LEARNING ---------- */
function renderLearning() {
  const cats = ['All', ...new Set(COURSES.map(c => c.category))];
  document.getElementById('learningFilters').innerHTML = cats.map(c =>
    `<div class="chip ${appData.learningFilter === c ? 'on' : ''}" onclick="setLearningFilter('${c}')">${c}</div>`).join('');
  const grid = document.getElementById('learningGrid');
  const list = COURSES.filter(c => appData.learningFilter === 'All' || c.category === appData.learningFilter);

  const iconMap = {
    'SQL': '🗄️', 'Excel': '📊', 'Python': '🐍', 'Data Visualization': '📈',
    'Statistics': '📉', 'JavaScript': '💻', 'React': '⚛️', 'CSS': '🎨',
    'HTML': '🌐', 'Git': '🔀', 'Figma': '🖌️', 'Wireframing': '📝',
    'User Research': '🔍', 'Design Systems': '🧩', 'SEO': '🔎',
    'Content Strategy': '✍️', 'Google Analytics': '📊', 'Social Media Ads': '📣',
    'Copywriting': '📝', 'Machine Learning': '🤖'
  };

  grid.innerHTML = list.map(c => {
    const done = appData.learningDone.has(c.id);
    const icon = iconMap[c.skill_covered] || '📚';
    return `<div class="list-card">
      <div class="lc-top">
        <div class="lc-icon">${icon}</div>
        <div class="tag-pill">${c.difficulty}</div>
      </div>
      <h4>${c.title}</h4>
      <div class="meta">${c.category} · Covers: ${c.skill_covered}</div>
      <div class="progress-mini"><div style="width:${done ? 100 : 0}%;"></div></div>
      <div class="lc-actions">
        <button class="btn-status ${done ? 'done' : ''}" onclick="toggleCourse('${c.id}')">${done ? '✓ Completed' : 'Mark Complete'}</button>
      </div>
    </div>`;
  }).join('');
}

function setLearningFilter(c) { appData.learningFilter = c; renderLearning(); }
function toggleCourse(id) {
  const numId = parseInt(id);
  if (appData.learningDone.has(numId)) appData.learningDone.delete(numId); else appData.learningDone.add(numId);
  saveProgressPersistent();
  renderLearning();
  toast(appData.learningDone.has(numId) ? 'Course marked complete \u2713' : 'Course reopened');
}

/* ============================================================
   PAGE INITIALIZATION
============================================================ */
async function initLearningPage() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === 'learning'));

  // Restore persistent progress before rendering
  loadProgressPersistent();

  try {
    COURSES = await API.getCourses();
  } catch (err) {
    toast('Could not load courses: ' + err.message);
    COURSES = [];
  }
  renderLearning();
}
initLearningPage();
