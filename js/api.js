// ── Book Bridge API Client ────────────────────────────────────────────────────
// Switch between local dev and production automatically
const API = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://bookbridge-api.onrender.com/api'; // ← replace with your Render URL

// Token helpers
function getToken()       { return localStorage.getItem('bb_token'); }
function setToken(t)      { localStorage.setItem('bb_token', t); }
function removeToken()    { localStorage.removeItem('bb_token'); }
function getSessionUser() { return JSON.parse(localStorage.getItem('bb_user') || 'null'); }
function setSessionUser(u){ localStorage.setItem('bb_user', JSON.stringify(u)); }
function clearSession()   { removeToken(); localStorage.removeItem('bb_user'); }

// Base fetch wrapper
async function apiFetch(path, options = {}) {
  const token = getToken();

  // For FormData uploads, don't set Content-Type — browser sets it with boundary
  const isFormData = options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.errors?.[0]?.msg || data.message || 'Something went wrong';
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    // Network error (server down, CORS, etc.)
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.');
    }
    throw err;
  }
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
const Auth = {
  async signup(payload) {
    const data = await apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify(payload) });
    setToken(data.token);
    setSessionUser(data.user);
    return data;
  },
  async login(payload) {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    setToken(data.token);
    setSessionUser(data.user);
    return data;
  },
  async me() {
    const data = await apiFetch('/auth/me');
    setSessionUser(data.user);
    return data.user;
  },
  logout() {
    clearSession();
    window.location.href = 'index.html';
  },
  isLoggedIn() { return !!getToken(); },
  user()       { return getSessionUser(); },
};

// ── BOOKS ─────────────────────────────────────────────────────────────────────
const Books = {
  async getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const data = await apiFetch(`/books${qs ? '?' + qs : ''}`);
    return data.books;
  },
  async getAuthors() {
    const data = await apiFetch('/books/authors');
    return data.authors;
  },
  async getOne(id)    { return (await apiFetch(`/books/${id}`)).book; },
  async create(book)  { return (await apiFetch('/books', { method: 'POST', body: JSON.stringify(book) })).book; },
  async update(id, b) { return (await apiFetch(`/books/${id}`, { method: 'PUT', body: JSON.stringify(b) })).book; },
  async remove(id)    { return apiFetch(`/books/${id}`, { method: 'DELETE' }); },
};

// ── CART ──────────────────────────────────────────────────────────────────────
const CartAPI = {
  async get()           { return (await apiFetch('/cart')).cart; },
  async add(bookId, type, days) {
    return (await apiFetch('/cart/add', { method: 'POST', body: JSON.stringify({ bookId, type, days }) })).cart;
  },
  async removeItem(itemId) {
    return (await apiFetch(`/cart/item/${itemId}`, { method: 'DELETE' })).cart;
  },
  async clear()         { return apiFetch('/cart/clear', { method: 'DELETE' }); },
};

// ── ORDERS ────────────────────────────────────────────────────────────────────
const Orders = {
  async create()        { return apiFetch('/orders/create', { method: 'POST' }); },
  async verify(payload) { return apiFetch('/orders/verify', { method: 'POST', body: JSON.stringify(payload) }); },
  async myOrders()      { return (await apiFetch('/orders/my')).orders; },
};

// ── FILE UPLOAD ───────────────────────────────────────────────────────────────
const Upload = {
  async cover(bookId, file) {
    const fd = new FormData();
    fd.append('cover', file);
    return apiFetch(`/upload/cover/${bookId}`, { method: 'POST', body: fd });
  },
  async manuscript(bookId, file) {
    const fd = new FormData();
    fd.append('manuscript', file);
    return apiFetch(`/upload/manuscript/${bookId}`, { method: 'POST', body: fd });
  },
};
