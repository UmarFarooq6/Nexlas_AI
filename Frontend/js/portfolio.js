/* ============================================================
   NEXLAS AI — PORTFOLIO PAGE
   Requires: api.js + shared.js loaded before this file.
============================================================ */

let portfolio = null;

/* ---------- RENDER PROFILE HEADER ---------- */
function renderProfileHeader() {
  const headerEl = document.getElementById('portfolioHeader');
  if (!headerEl) return;

  if (!portfolio) {
    headerEl.innerHTML = '<div style="font-size:13px;color:var(--text-faint);padding:10px;">Log in and complete your diagnosis to see your portfolio.</div>';
    return;
  }

  const initials = (portfolio.name || '').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const skills = (portfolio.skills || []).map(s => typeof s === 'string' ? s : s.skill).filter(Boolean);
  const links = portfolio.social_links || {};

  headerEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
      <div style="width:52px;height:52px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;">${initials}</div>
      <div>
        <div style="font-weight:700;font-size:16px;">${portfolio.name}</div>
        <div style="font-size:12px;color:var(--text-dim);">${portfolio.career_goal || 'No career goal set'}</div>
      </div>
    </div>
    ${portfolio.bio ? `<p style="font-size:13px;color:var(--text-dim);margin-bottom:10px;">${portfolio.bio}</p>` : ''}
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
      ${skills.map(s => `<div class="chip on" style="cursor:default;font-size:11px;padding:4px 10px;">${s}</div>`).join('')}
    </div>
    ${Object.keys(links).length ? `<div style="display:flex;gap:10px;font-size:12px;">
      ${links.linkedin ? `<a href="${links.linkedin}" target="_blank">LinkedIn</a>` : ''}
      ${links.github ? `<a href="${links.github}" target="_blank">GitHub</a>` : ''}
      ${links.website ? `<a href="${links.website}" target="_blank">Website</a>` : ''}
    </div>` : ''}
  `;
}

/* ---------- RENDER BIO EDIT ---------- */
function renderBioEditor() {
  const editorEl = document.getElementById('bioEditor');
  if (!editorEl) return;

  if (!portfolio) { editorEl.style.display = 'none'; return; }
  editorEl.style.display = 'block';

  const links = portfolio.social_links || {};
  editorEl.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;">
      <input class="field" id="bioLinkedIn" placeholder="LinkedIn URL" value="${links.linkedin || ''}"/>
      <input class="field" id="bioGitHub" placeholder="GitHub URL" value="${links.github || ''}"/>
      <input class="field" id="bioWebsite" placeholder="Personal Website" value="${links.website || ''}"/>
    </div>
    <textarea class="field" id="bioText" placeholder="Write a short bio / about me..." style="min-height:60px;">${portfolio.bio || ''}</textarea>
    <button class="btn-primary" style="margin-top:8px;" onclick="saveBio()">Save Bio & Links</button>
  `;
}

/* ---------- RENDER PORTFOLIO ITEMS ---------- */
function renderPortfolioGrid() {
  const grid = document.getElementById('portfolioGrid');
  if (!grid) return;

  if (!portfolio) {
    grid.innerHTML = '';
    return;
  }

  const items = [];

  // Education card
  if (portfolio.education && portfolio.education.level) {
    items.push({
      icon: '🎓', type: 'Education',
      title: portfolio.education.level,
      desc: portfolio.education.field ? 'Field: ' + portfolio.education.field : '',
    });
  }

  // Experience card
  if (portfolio.experience && portfolio.experience.years) {
    items.push({
      icon: '💼', type: 'Experience',
      title: portfolio.experience.years,
      desc: portfolio.experience.field || '',
    });
  }

  // Career match card
  if (portfolio.career_match) {
    items.push({
      icon: '🎯', type: 'Career Match',
      title: portfolio.career_match,
      desc: portfolio.fit_score ? Math.round(portfolio.fit_score) + '% fit score' : '',
    });
  }

  // Interests card
  if (portfolio.interests && portfolio.interests.length) {
    items.push({
      icon: '💡', type: 'Interests',
      title: portfolio.interests.join(', '),
      desc: '',
    });
  }

  // Featured projects
  (portfolio.featured_projects || []).forEach(p => {
    items.push({
      icon: '📂', type: p.category || 'Project',
      title: p.title,
      desc: p.description || '',
      links: (p.live_url ? `<a href="${p.live_url}" target="_blank">Live</a>` : '') +
             (p.repo_url ? ' · <a href="' + p.repo_url + '" target="_blank">Code</a>' : ''),
    });
  });

  // User-added portfolio items (from the form on the page)
  const userItems = JSON.parse(sessionStorage.getItem('pf_user_items_' + API.getUserId()) || '[]');
  userItems.forEach(item => {
    items.push({
      icon: item.type === 'Code Repository' ? '💻' : item.type === 'Design Work' ? '🎨' : item.type === 'Certificate' ? '🏅' : item.type === 'Writing Sample' ? '✍️' : '📄',
      type: item.type,
      title: item.title,
      desc: item.link || '',
      links: item.link ? `<a href="${item.link}" target="_blank">View</a>` : '',
    });
  });

  if (items.length === 0) {
    grid.innerHTML = '<div style="font-size:12.5px;color:var(--text-faint);grid-column:1/-1;">Complete your diagnosis and add projects to build your portfolio.</div>';
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="list-card">
      <div class="lc-top">
        <div class="lc-icon">${item.icon}</div>
        <div class="tag-pill">${item.type}</div>
      </div>
      <h4>${item.title}</h4>
      ${item.desc ? `<p class="desc" style="font-size:12px;color:var(--text-dim);margin:4px 0;">${item.desc}</p>` : ''}
      ${item.links ? `<div style="font-size:11px;margin-top:4px;">${item.links}</div>` : ''}
    </div>`).join('');
}

/* ---------- ADD PORTFOLIO ITEM (form on page) ---------- */
function addPortfolioItem() {
  const titleEl = document.getElementById('pfTitle');
  const typeEl = document.getElementById('pfType');
  const linkEl = document.getElementById('pfLink');
  if (!titleEl || !typeEl) return;

  const title = titleEl.value.trim();
  if (!title) { toast('Please enter a title.'); return; }

  const userId = API.getUserId();
  const item = { title, type: typeEl.value, link: linkEl ? linkEl.value.trim() : '' };

  // Store locally (these are supplementary items beyond auto-generated portfolio)
  const key = 'pf_user_items_' + (userId || 'anon');
  const items = JSON.parse(sessionStorage.getItem(key) || '[]');
  items.push(item);
  sessionStorage.setItem(key, JSON.stringify(items));

  titleEl.value = '';
  if (linkEl) linkEl.value = '';
  toast('Portfolio item added ✓');
  renderPortfolioGrid();
}

/* ---------- SAVE BIO ---------- */
async function saveBio() {
  const userId = API.getUserId();
  if (!userId) { toast('Please log in first.'); return; }

  const bio = document.getElementById('bioText')?.value.trim() || '';
  const linkedin = document.getElementById('bioLinkedIn')?.value.trim() || '';
  const github = document.getElementById('bioGitHub')?.value.trim() || '';
  const website = document.getElementById('bioWebsite')?.value.trim() || '';

  try {
    portfolio = await API.updatePortfolio(userId, {
      bio,
      social_links: { linkedin, github, website },
    });
    toast('Bio and links saved ✓');
    renderProfileHeader();
  } catch (err) {
    toast('Could not save: ' + err.message);
  }
}

/* ============================================================
   PAGE INITIALIZATION
============================================================ */
async function initPortfolioPage() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === 'portfolio'));

  const userId = API.getUserId();
  if (userId) {
    try {
      portfolio = await API.getPortfolio(userId);
    } catch (err) {
      portfolio = null;
    }
  }

  renderProfileHeader();
  renderBioEditor();
  renderPortfolioGrid();
}
initPortfolioPage();
