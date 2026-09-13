/* ============================================================
   NEXLAS AI — API CLIENT
   Centralized helper for all backend communication.
   Include this via <script src="...api.js"> before any page JS.
============================================================ */

// Same-origin: the API is served by the same server that serves these pages
const API_BASE = window.location.origin;

/* Turn a FastAPI error `detail` (string, validation list, or object)
   into a readable message instead of "[object Object]". */
function _formatApiError(detail) {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(d => (d && d.msg) ? d.msg : JSON.stringify(d)).join('; ');
  }
  try { return JSON.stringify(detail); } catch (e) { return String(detail); }
}

const API = {
  /* ---- session helpers ---- */
  getSession() {
    try { return JSON.parse(sessionStorage.getItem('nexlas_session')); }
    catch (e) { return null; }
  },
  setSession(user) {
    sessionStorage.setItem('nexlas_session', JSON.stringify(user));
  },
  clearSession() {
    sessionStorage.removeItem('nexlas_session');
  },
  getUserId() {
    const s = this.getSession();
    return s ? s.id : null;
  },

  /* ---- generic fetch wrapper ---- */
  async request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(API_BASE + path, opts);
    } catch (e) {
      throw new Error('Cannot reach the Nexlas server — start it with "uvicorn main:app" from the Backend folder and open the app at http://localhost:8000');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      // Stale login: the stored user id no longer exists (e.g. the database was
      // reset). Clear the session so pages fall back to the guest state and the
      // user gets one clear message instead of repeated "User not found" errors.
      if (res.status === 404 && err.detail === 'User not found' && this.getSession()) {
        this.clearSession();
        throw new Error('Your login is no longer valid — please log in again.');
      }
      throw new Error(_formatApiError(err.detail) || 'Request failed');
    }
    return res.json();
  },

  /* ---- auth ---- */
  register(name, email, password) {
    return this.request('POST', '/auth/register', { name, email, password });
  },
  login(email, password) {
    return this.request('POST', '/auth/login', { email, password });
  },

  /* ---- diagnostic chat ---- */
  getProfile(userId) {
    return this.request('GET', '/chat/profile/' + userId);
  },
  getNextQuestion(userId) {
    return this.request('GET', '/chat/next/' + userId);
  },
  submitAnswers(userId, answers) {
    return this.request('POST', '/chat/answer', { user_id: userId, answers });
  },

  /* ---- recommendations ---- */
  getRecommendations(userId) {
    return this.request('GET', '/recommendations/' + userId);
  },

  /* ---- roadmap ---- */
  getRoadmap(userId) {
    return this.request('GET', '/roadmap/' + userId);
  },

  /* ---- catalog ---- */
  getCourses() {
    return this.request('GET', '/recommendations/catalog/courses');
  },
  getMentors() {
    return this.request('GET', '/recommendations/catalog/mentors');
  },

  /* ---- projects ---- */
  getProjects(userId) {
    return this.request('GET', '/projects/' + userId);
  },
  createProject(userId, data) {
    return this.request('POST', '/projects/' + userId, data);
  },
  updateProject(projectId, data) {
    return this.request('PUT', '/projects/' + projectId, data);
  },
  deleteProject(projectId) {
    return this.request('DELETE', '/projects/' + projectId);
  },
  toggleProjectFeatured(projectId) {
    return this.request('POST', '/projects/' + projectId + '/featured');
  },

  /* ---- portfolio ---- */
  getPortfolio(userId) {
    return this.request('GET', '/portfolio/' + userId);
  },
  updatePortfolio(userId, data) {
    return this.request('PUT', '/portfolio/' + userId, data);
  },

  /* ---- mentor sessions ---- */
  getSessions(userId) {
    return this.request('GET', '/sessions/' + userId);
  },
  bookSession(userId, mentorId) {
    return this.request('POST', '/sessions/' + userId, { mentor_id: mentorId });
  },
  cancelSession(sessionId) {
    return this.request('PUT', '/sessions/' + sessionId + '/cancel');
  },
};
