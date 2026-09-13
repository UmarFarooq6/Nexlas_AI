/* ============================================================
   NEXLAS AI — MENTORS PAGE
   Requires: api.js + shared.js loaded before this file.
============================================================ */

let MENTORS = [];
let mySessions = [];   // loaded from backend

/* ---------- MENTORS ---------- */
function renderMentors() {
  const cats = ['All', ...new Set(MENTORS.map(m => m.specialization))];
  document.getElementById('mentorFilters').innerHTML = cats.map(c =>
    `<div class="chip ${appData.mentorFilter === c ? 'on' : ''}" onclick="setMentorFilter('${c}')">${c}</div>`).join('');
  const grid = document.getElementById('mentorGrid');
  const list = MENTORS.filter(m => appData.mentorFilter === 'All' || m.specialization === appData.mentorFilter);

  // Check if user already has an active session
  const activeSession = mySessions.find(s => s.status === 'active');

  grid.innerHTML = list.map(m => {
    const isBooked = activeSession && activeSession.mentor_id === m.id;
    // Local initials avatar — no external avatar service needed (works offline too)
    const initials = (m.name || '').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    return `
    <div class="list-card ${isBooked ? 'booked' : ''}">
      <div class="lc-top">
        <div class="mentor-avatar">${initials}</div>
        <div class="tag-pills">
          ${isBooked ? '<div class="tag-pill booked-pill">✓ Your active session</div>' : ''}
          <div class="tag-pill">${m.specialization}</div>
        </div>
      </div>
      <h4>${m.name}</h4>
      <p class="desc">${m.bio}</p>
      <div class="mentor-contact">
        <div class="contact-row">✉️ <a href="mailto:${m.email}">${m.email}</a></div>
      </div>
      <div class="lc-actions">
        <button class="btn-status ${isBooked ? 'done' : ''}" ${isBooked ? 'disabled' : ''} onclick="bookMentor(${m.id},'${m.name.replace(/'/g, "\\'")}')">${isBooked ? '✓ Booked' : 'Book Session'}</button>
      </div>
    </div>`;
  }).join('');
}
function setMentorFilter(c) { appData.mentorFilter = c; renderMentors(); }

async function bookMentor(mentorId, name) {
  const userId = API.getUserId();
  if (!userId) { toast('Please log in to book a session.'); return; }

  try {
    await API.bookSession(userId, mentorId);
    toast(`Session booked with ${name} ✓`);
    await loadSessions();
  } catch (err) {
    toast(err.message || 'Could not book session.');
  }
}

function renderSessions() {
  const wrap = document.getElementById('mySessions');
  const activeSessions = mySessions.filter(s => s.status === 'active');
  const pastSessions = mySessions.filter(s => s.status !== 'active');

  let html = '';

  if (activeSessions.length === 0) {
    html += '<div style="font-size:12.5px;color:var(--text-faint);">No active sessions booked.</div>';
  } else {
    html += activeSessions.map(s => `
      <div class="mini-row-item">
        <div class="icb">🧑‍🏫</div>
        <div class="grow"><b>${s.mentor_name}</b><span>${s.mentor_specialization || ''} · Booked ${new Date(s.booked_at).toLocaleDateString()}</span></div>
        <button class="btn-status" style="flex:none;padding:6px 10px;" onclick="cancelSession(${s.id})">Cancel</button>
      </div>`).join('');
  }

  if (pastSessions.length) {
    html += `<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.3px;color:var(--text-faint);margin:14px 0 6px;">Session history</div>`;
    html += pastSessions.map(s => `
      <div class="mini-row-item">
        <div class="icb">${s.status === 'cancelled' ? '🚫' : '✅'}</div>
        <div class="grow"><b>${s.mentor_name}</b><span>${s.status === 'cancelled' ? 'Cancelled' : 'Completed'} · Booked ${new Date(s.booked_at).toLocaleDateString()}</span></div>
      </div>`).join('');
  }

  wrap.innerHTML = html;
}

async function cancelSession(sessionId) {
  try {
    await API.cancelSession(sessionId);
    toast('Session cancelled');
    await loadSessions();
  } catch (err) {
    toast('Could not cancel: ' + err.message);
  }
}

async function loadSessions() {
  const userId = API.getUserId();
  if (!userId) { mySessions = []; return; }
  try {
    mySessions = await API.getSessions(userId);
  } catch (err) {
    mySessions = [];
  }
  renderSessions();
  renderMentors();  // re-render to update booked state
}

/* ============================================================
   PAGE INITIALIZATION
============================================================ */
async function initMentorsPage() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === 'mentors'));
  try {
    MENTORS = await API.getMentors();
  } catch (err) {
    toast('Could not load mentors: ' + err.message);
    MENTORS = [];
  }
  await loadSessions();
}
initMentorsPage();
