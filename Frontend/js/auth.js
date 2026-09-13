/* ============================================================
   NEXLAS AI — AUTH (connected to backend API)
============================================================ */

/* ---------- clear stale localStorage from any prior session ---------- */
function _clearStaleStorage() {
  // Prefer the shared.js helper if available; otherwise do it directly
  if (typeof clearAllNexlasStorage === 'function') { clearAllNexlasStorage(); return; }
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('nexlasState') || k.startsWith('nexlasAppData'))) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- error banner ---------- */
function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
function hideAuthError() {
  const el = document.getElementById('authError');
  if (!el) return;
  el.classList.remove('show');
}

/* ---------- REGISTER ---------- */
async function handleRegister(e) {
  e.preventDefault();
  hideAuthError();

  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;

  if (!name || !email || !password || !confirm) {
    showAuthError('Please fill in every field.');
    return;
  }
  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters.');
    return;
  }
  if (password !== confirm) {
    showAuthError('Passwords do not match.');
    return;
  }

  try {
    const user = await API.register(name, email, password);
    // Clear any stale data from a previous session before storing the new one
    _clearStaleStorage();
    API.setSession({ id: user.id, name: user.name, email: user.email });
    toast('Account created! Redirecting…');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);
  } catch (err) {
    showAuthError(err.message || 'Registration failed. Please try again.');
  }
}

/* ---------- LOGIN ---------- */
async function handleLogin(e) {
  e.preventDefault();
  hideAuthError();

  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showAuthError('Please enter your email and password.');
    return;
  }

  try {
    const user = await API.login(email, password);
    // Clear any stale data from a previous session before storing the new one
    _clearStaleStorage();
    API.setSession({ id: user.id, name: user.name, email: user.email });
    toast('Welcome back, ' + user.name.split(' ')[0] + '!');
    setTimeout(() => { window.location.href = 'index.html'; }, 700);
  } catch (err) {
    showAuthError(err.message || 'Incorrect email or password.');
  }
}

/* ---------- LOGOUT ---------- */
function logout() {
  API.clearSession();
  _clearStaleStorage();
  window.location.href = 'index.html';
}

/* ---------- toggle password visibility ---------- */
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}
