// Redirect if already logged in
if (Auth.isLoggedIn()) window.location.href = 'dashboard.html';

// ── Helpers ───────────────────────────────────────────────────────────────────
function setErr(id, msg) {
  const el = document.getElementById('err-' + id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
  const input = document.getElementById(id.replace('err-',''));
  if (input) input.classList.toggle('invalid', !!msg);
}
function clearAllErrors() {
  document.querySelectorAll('.field-error').forEach(e => { e.textContent = ''; e.style.display = 'none'; });
  document.querySelectorAll('input').forEach(i => i.classList.remove('invalid'));
  ['loginError','signupError'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = ''; });
}

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }

function checkStrength(pw) {
  const bar = document.getElementById('pwBar'), hint = document.getElementById('pwHint');
  if (!bar) return;
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12)          s++;
  const lvl = ['','weak','fair','good','strong','very-strong'];
  const lbl = ['','Weak','Fair','Good','Strong','Very Strong'];
  bar.className    = 'pw-bar ' + (lvl[s] || '');
  hint.textContent = pw.length ? lbl[s] : '';
}

function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

function switchTab(tab) {
  clearAllErrors();
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  if (tab === 'login') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('loginForm').classList.remove('hidden');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('signupForm').classList.remove('hidden');
  }
}

function highlightRole() {
  const val = document.querySelector('input[name="role"]:checked').value;
  document.getElementById('roleReaderCard').classList.toggle('role-card--active', val === 'reader');
  document.getElementById('roleWriterCard').classList.toggle('role-card--active', val === 'writer');
}

document.addEventListener('DOMContentLoaded', highlightRole);

// ── LOGIN ─────────────────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  clearAllErrors();

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  let valid = true;

  if (!email)                { setErr('loginEmail', 'Email is required.');              valid = false; }
  else if (!isValidEmail(email)) { setErr('loginEmail', 'Enter a valid email address.'); valid = false; }
  if (!password)             { setErr('loginPassword', 'Password is required.');        valid = false; }
  if (!valid) return;

  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Logging in…'; btn.disabled = true;

  try {
    await Auth.login({ email, password });
    window.location.href = 'dashboard.html';
  } catch (err) {
    const msg = err.message;
    if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account')) {
      setErr('loginEmail', msg);
    } else {
      setErr('loginPassword', msg);
    }
  } finally {
    btn.textContent = 'Login'; btn.disabled = false;
  }
}

// ── SIGNUP ────────────────────────────────────────────────────────────────────
async function handleSignup(e) {
  e.preventDefault();
  clearAllErrors();

  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const username = document.getElementById('signupUsername').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm  = document.getElementById('signupConfirm').value;
  const role     = document.querySelector('input[name="role"]:checked').value;
  let valid = true;

  if (!name || name.length < 2)          { setErr('signupName',     'Full name must be at least 2 characters.'); valid = false; }
  if (!email)                            { setErr('signupEmail',    'Email is required.'); valid = false; }
  else if (!isValidEmail(email))         { setErr('signupEmail',    'Enter a valid email (e.g. user@example.com).'); valid = false; }
  if (!username)                         { setErr('signupUsername', 'Username is required.'); valid = false; }
  else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { setErr('signupUsername', 'Username: 3–20 chars, letters/numbers/underscore only.'); valid = false; }
  if (!password)                         { setErr('signupPassword', 'Password is required.'); valid = false; }
  else if (password.length < 8)          { setErr('signupPassword', 'Password must be at least 8 characters.'); valid = false; }
  else if (!/[0-9]/.test(password))      { setErr('signupPassword', 'Password must contain at least one number.'); valid = false; }
  else if (!/[^A-Za-z0-9]/.test(password)) { setErr('signupPassword', 'Password must contain at least one special character.'); valid = false; }
  if (!confirm)                          { setErr('signupConfirm',  'Please confirm your password.'); valid = false; }
  else if (password !== confirm)         { setErr('signupConfirm',  'Passwords do not match.'); valid = false; }
  if (!valid) return;

  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Creating account…'; btn.disabled = true;

  try {
    await Auth.signup({ name, email, username, password, role });
    window.location.href = 'dashboard.html';
  } catch (err) {
    const msg = err.message;
    if (msg.toLowerCase().includes('email'))    setErr('signupEmail', msg);
    else if (msg.toLowerCase().includes('username')) setErr('signupUsername', msg);
    else document.getElementById('signupError').textContent = msg;
  } finally {
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
}
