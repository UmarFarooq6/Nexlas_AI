/* ============================================================
   NEXLAS AI — PROJECTS PAGE
   Requires: api.js + shared.js loaded before this file.
============================================================ */

let myProjects = [];
let projectFilter = 'All';

/* ---------- PROJECT IDEAS (suggested based on interests) ---------- */
const PROJECT_IDEAS = {
  'Data': [
    { title: 'Sales Dashboard in Excel', category: 'Data Analysis', technologies: ['Excel'], description: 'Build an interactive sales performance dashboard using pivot tables, charts, and conditional formatting.' },
    { title: 'Customer Churn Analysis', category: 'Data Analysis', technologies: ['Python', 'Statistics'], description: 'Analyze a dataset to identify patterns in customer churn using Python and statistical methods.' },
    { title: 'SQL Data Warehouse Query Project', category: 'Data Analysis', technologies: ['SQL'], description: 'Design and query a mock data warehouse to practice advanced SQL joins, CTEs and window functions.' },
  ],
  'Web Development': [
    { title: 'Personal Portfolio Website', category: 'Web Dev', technologies: ['HTML', 'CSS', 'JavaScript'], description: 'Design and build a responsive personal portfolio to showcase your skills and projects.' },
    { title: 'React Task Manager App', category: 'Web Dev', technologies: ['React', 'JavaScript'], description: 'Create a full CRUD task manager with filtering, drag-and-drop and local storage persistence.' },
    { title: 'CSS Animation Library', category: 'Web Dev', technologies: ['CSS', 'HTML'], description: 'Build a reusable CSS animation library with keyframe animations for common UI patterns.' },
  ],
  'Design': [
    { title: 'Mobile App Redesign', category: 'Design', technologies: ['Figma', 'User Research'], description: 'Pick a popular app and redesign its core flow with wireframes, prototypes and user testing notes.' },
    { title: 'Design System Starter Kit', category: 'Design', technologies: ['Figma', 'Design Systems'], description: 'Create a mini design system with typography, color palette, components and usage guidelines.' },
  ],
  'Marketing': [
    { title: 'SEO Audit Report', category: 'Marketing', technologies: ['SEO', 'Google Analytics'], description: 'Conduct a full SEO audit on a sample website and present actionable recommendations.' },
    { title: 'Social Media Campaign Plan', category: 'Marketing', technologies: ['Content Strategy', 'Social Media Ads'], description: 'Plan a 30-day social media campaign with content calendar, ad copy and KPI tracking.' },
  ],
  'Machine Learning': [
    { title: 'House Price Predictor', category: 'Machine Learning', technologies: ['Python', 'Machine Learning', 'Statistics'], description: 'Train a regression model to predict house prices using a public dataset and evaluate its accuracy.' },
    { title: 'Image Classifier with CNN', category: 'Machine Learning', technologies: ['Python', 'Machine Learning'], description: 'Build a simple CNN to classify images from the CIFAR-10 dataset and visualize the results.' },
  ],
};

/* ---------- RENDER ---------- */
function renderProjectFilters() {
  const cats = ['All', 'Idea', 'In Progress', 'Completed'];
  document.getElementById('projectFilters').innerHTML = cats.map(c =>
    `<div class="chip ${projectFilter === c ? 'on' : ''}" onclick="setProjectFilter('${c}')">${c}</div>`
  ).join('');
}

function renderProjectGrid() {
  const grid = document.getElementById('projectGrid');
  const userId = API.getUserId();

  // Show project ideas based on user interests
  const session = API.getSession();
  let ideas = [];
  try {
    // Try to get interests from localStorage state
    const stored = JSON.parse(localStorage.getItem('nexlasState_' + (session ? session.id : 'anon')) || 'null');
    const interests = stored ? stored.interests || [] : [];
    interests.forEach(i => { if (PROJECT_IDEAS[i]) ideas = ideas.concat(PROJECT_IDEAS[i]); });
  } catch (e) { /* ignore */ }

  // If no interests, show all ideas
  if (ideas.length === 0) {
    Object.values(PROJECT_IDEAS).forEach(arr => { ideas = ideas.concat(arr); });
  }

  // De-duplicate by title
  const seen = new Set();
  ideas = ideas.filter(idea => { if (seen.has(idea.title)) return false; seen.add(idea.title); return true; });

  const iconMap = {
    'Data Analysis': '📊', 'Web Dev': '💻', 'Design': '🎨',
    'Marketing': '📣', 'Machine Learning': '🤖'
  };

  // Titles already in the user's list — used to mark idea cards as "✓ Added"
  // so it's obvious the project was actually saved (and to avoid duplicates).
  const myTitles = new Set(myProjects.map(p => p.title));

  grid.innerHTML = ideas.slice(0, 6).map(idea => {
    const icon = iconMap[idea.category] || '📂';
    const added = myTitles.has(idea.title);
    return `<div class="list-card">
      <div class="lc-top">
        <div class="lc-icon">${icon}</div>
        <div class="tag-pill">${idea.category}</div>
      </div>
      <h4>${idea.title}</h4>
      <div class="meta">${idea.technologies.join(' · ')}</div>
      <p class="desc" style="font-size:12px;color:var(--text-dim);margin:6px 0;">${idea.description}</p>
      <div class="lc-actions">
        <button class="btn-status ${added ? 'done' : ''}" ${added ? 'disabled' : ''} onclick='addProjectIdea(${JSON.stringify(idea).replace(/'/g, "\\'")})'>${added ? '✓ Added' : '+ Add to My Projects'}</button>
      </div>
    </div>`;
  }).join('');
}

function renderMyProjects() {
  const wrap = document.getElementById('myProjects');
  let list = myProjects;
  if (projectFilter !== 'All') {
    list = list.filter(p => p.status === projectFilter);
  }

  if (list.length === 0) {
    wrap.innerHTML = '<div style="font-size:12.5px;color:var(--text-faint);">' +
      (myProjects.length === 0 ? 'Add a project idea above to start tracking it.' : 'No projects match this filter.') + '</div>';
    return;
  }

  const statusIcon = { 'Idea': '💡', 'In Progress': '🔨', 'Completed': '✅' };
  wrap.innerHTML = list.map(p => `
    <div class="mini-row-item" style="flex-wrap:wrap;gap:8px;">
      <div class="icb">${statusIcon[p.status] || '📂'}</div>
      <div class="grow">
        <b>${p.title}</b>
        <span>${p.category} · ${(p.technologies || []).join(', ') || 'No tech'}</span>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        ${p.status !== 'Completed' ? `<button class="btn-status" style="flex:none;padding:5px 9px;font-size:11px;" onclick="advanceProjectStatus(${p.id})">${p.status === 'Idea' ? 'Start →' : 'Complete ✓'}</button>` : ''}
        <button class="btn-status ${p.featured ? 'done' : ''}" style="flex:none;padding:5px 9px;font-size:11px;" onclick="toggleFeatured(${p.id})">${p.featured ? '★ Featured' : '☆ Feature'}</button>
        <button class="btn-status" style="flex:none;padding:5px 9px;font-size:11px;" onclick="deleteProject(${p.id})">✕</button>
      </div>
    </div>`).join('');
}

/* ---------- ACTIONS ---------- */
function setProjectFilter(c) {
  projectFilter = c;
  renderProjectFilters();
  renderMyProjects();
}

async function addProjectIdea(idea) {
  const userId = API.getUserId();
  if (!userId) { toast('Please log in first.'); return; }
  if (myProjects.some(p => p.title === idea.title)) { toast('This project is already in your list.'); return; }
  try {
    await API.createProject(userId, {
      title: idea.title,
      description: idea.description || '',
      category: idea.category || 'Other',
      technologies: idea.technologies || [],
      status: 'Idea',
    });
    toast('Project added to your list ✓');
    await loadMyProjects();
  } catch (err) {
    toast('Could not add project: ' + err.message);
  }
}

async function advanceProjectStatus(id) {
  try {
    const project = myProjects.find(p => p.id === id);
    if (!project) return;
    const nextStatus = project.status === 'Idea' ? 'In Progress' : 'Completed';
    await API.updateProject(id, { status: nextStatus });
    toast('Project updated to ' + nextStatus);
    await loadMyProjects();
  } catch (err) {
    toast('Could not update: ' + err.message);
  }
}

async function toggleFeatured(id) {
  try {
    await API.toggleProjectFeatured(id);
    toast('Featured status toggled');
    await loadMyProjects();
  } catch (err) {
    toast('Could not toggle: ' + err.message);
  }
}

async function deleteProject(id) {
  try {
    await API.deleteProject(id);
    toast('Project removed');
    await loadMyProjects();
  } catch (err) {
    toast('Could not delete: ' + err.message);
  }
}

async function loadMyProjects() {
  const userId = API.getUserId();
  if (!userId) { myProjects = []; return; }
  try {
    myProjects = await API.getProjects(userId);
  } catch (err) {
    myProjects = [];
  }
  renderMyProjects();
  renderProjectGrid();  // refresh the "✓ Added" state on the idea cards
}

/* ============================================================
   PAGE INITIALIZATION
============================================================ */
async function initProjectsPage() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === 'projects'));
  renderProjectFilters();
  renderProjectGrid();
  await loadMyProjects();
}
initProjectsPage();
