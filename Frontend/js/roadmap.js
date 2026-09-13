/* ============================================================
   NEXLAS AI — ROADMAP PAGE
   Requires: api.js + shared.js loaded before this file.
============================================================ */

const MONTH_LABELS = { month1: 'Month 1 (Days 1–30)', month2: 'Month 2 (Days 31–60)', month3: 'Month 3 (Days 61–90)' };
let roadmapData = { month1: [], month2: [], month3: [] };
let roadmapMeta = null;

/* ---------- ROADMAP ---------- */
function getFlatRoadmap() {
  return Object.values(roadmapData).flat();
}

function renderRoadmap() {
  const grid = document.getElementById('roadmapGrid');
  let html = '';

  if (!getFlatRoadmap().length) {
    grid.innerHTML = '<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--text-dim);font-size:13px;">No roadmap yet. Complete your career diagnosis on NexlasGPT first, then come back here.</div>';
    document.getElementById('roadmapProgressFill').style.width = '0%';
    document.getElementById('roadmapProgressLabel').textContent = 'No roadmap available yet';
    return;
  }

  // Show meta info if available
  if (roadmapMeta) {
    html += `<div style="grid-column:1/-1;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="font-size:24px;">🎯</span>
        <div>
          <div style="font-size:15px;font-weight:700;">${roadmapMeta.career_recommendation}</div>
          <div style="font-size:12px;color:var(--success);font-weight:700;">${Math.round(roadmapMeta.fit_score)}% Fit Score</div>
        </div>
      </div>
      ${roadmapMeta.next_action ? `<div style="font-size:12px;color:var(--text-dim);padding:8px 12px;background:var(--card-bg-soft, rgba(155,123,255,.06));border-radius:8px;">💡 ${roadmapMeta.next_action}</div>` : ''}
    </div>`;
  }

  for (const [key, label] of Object.entries(MONTH_LABELS)) {
    const items = roadmapData[key] || [];
    if (!items.length) continue;
    html += `<div style="grid-column:1/-1;margin-top:14px;"><h3 style="font-size:15px;color:var(--accent-1);margin-bottom:2px;">${label}</h3></div>`;
    items.forEach((item, i) => {
      const id = key + '_' + i;
      const done = appData.roadmapDone.has(id);
      html += `<div class="list-card">
        <div class="lc-top">
          <div class="lc-icon">${done ? '✅' : '📘'}</div>
          <div class="tag-pill" style="${done ? 'background:var(--success-soft);color:var(--success);border-color:var(--success);' : ''}">${done ? 'Completed' : 'Pending'}</div>
        </div>
        <h4>${item}</h4>
        <div class="lc-actions">
          <button class="btn-status ${done ? 'done' : ''}" onclick="toggleRoadmapStep('${id}')">${done ? '✓ Marked Complete' : 'Mark as Complete'}</button>
        </div>
      </div>`;
    });
  }
  grid.innerHTML = html;
  updateRoadmapProgress();
}

function toggleRoadmapStep(id) {
  if (appData.roadmapDone.has(id)) appData.roadmapDone.delete(id); else appData.roadmapDone.add(id);
  saveProgressPersistent();
  renderRoadmap();
  toast(appData.roadmapDone.has(id) ? 'Milestone marked complete' : 'Milestone reopened');
}

function updateRoadmapProgress() {
  const total = getFlatRoadmap().length;
  const pct = total ? Math.round((appData.roadmapDone.size / total) * 100) : 0;
  document.getElementById('roadmapProgressFill').style.width = pct + '%';
  document.getElementById('roadmapProgressLabel').textContent = total
    ? `${appData.roadmapDone.size} of ${total} milestones complete (${pct}%)`
    : 'No roadmap available yet';
}

/* ============================================================
   PAGE INITIALIZATION
============================================================ */
async function initRoadmapPage() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === 'roadmap'));

  // Restore persistent progress before rendering
  loadProgressPersistent();

  const userId = API.getUserId();
  if (userId) {
    try {
      const data = await API.getRoadmap(userId);
      roadmapMeta = data;
      if (data.roadmap_steps) {
        roadmapData = {
          month1: data.roadmap_steps.month1 || [],
          month2: data.roadmap_steps.month2 || [],
          month3: data.roadmap_steps.month3 || [],
        };
      }
    } catch (err) {
      // Not completed yet — show empty state
      roadmapData = { month1: [], month2: [], month3: [] };
      roadmapMeta = null;
    }
  }

  renderRoadmap();
}
initRoadmapPage();
