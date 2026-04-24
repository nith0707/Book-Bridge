// ── Auth guard ────────────────────────────────────────────────────────────────
function requireAuth() {
  if (!Auth.isLoggedIn()) window.location.href = 'index.html';
}

function getSession()  { return Auth.user(); }
function logout()      { Auth.logout(); }

// ── Cart badge ────────────────────────────────────────────────────────────────
async function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  try {
    const cart = await CartAPI.get();
    badge.textContent = cart?.items?.length || 0;
  } catch { badge.textContent = 0; }
}

// ── Role-aware navbar ─────────────────────────────────────────────────────────
function buildNav(activePage) {
  const nav = document.getElementById('navLinks');
  if (!nav) return;
  const role = (Auth.user() || {}).role || 'reader';
  const a = (page, href, label) =>
    `<a href="${href}" ${activePage===page?'class="active"':''}>${label}</a>`;
  nav.innerHTML = role === 'writer'
    ? `${a('dashboard','dashboard.html','Dashboard')}${a('add-book','add-book.html','Add Book')}<button class="btn-logout" onclick="logout()">Logout</button>`
    : `${a('dashboard','dashboard.html','Dashboard')}${a('browse','browse.html','Browse Books')}<a href="cart.html" ${activePage==='cart'?'class="active"':''}>🛒 Cart <span id="cartCount" class="cart-badge">0</span></a><button class="btn-logout" onclick="logout()">Logout</button>`;
  updateCartBadge();
}

// ── AI fallback cover ─────────────────────────────────────────────────────────
function aiFallbackUrl(title, author, category) {
  const p = `professional book cover art for "${title}" by ${author}, ${category} genre, dramatic cinematic lighting, highly detailed digital illustration, no text, no words`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=300&height=420&nologo=true&seed=${encodeURIComponent(title)}`;
}

requireAuth();
updateCartBadge();
