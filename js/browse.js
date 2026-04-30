let allBooks     = [];
let allBooksMap  = {}; // id → book, for fast lookup
let currentBook  = null;
let currentBuyBook = null;

buildNav('browse');

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  await Promise.all([loadBooks(), loadAuthors()]);
}

async function loadBooks(params = {}) {
  try {
    allBooks = await Books.getAll(params);
    // build lookup map
    allBooksMap = {};
    allBooks.forEach(b => { allBooksMap[String(b._id)] = b; });
    renderBooks(allBooks);
  } catch (err) {
    showToast('Failed to load books: ' + err.message);
  }
}

async function loadAuthors() {
  try {
    const authors = await Books.getAuthors();
    const select  = document.getElementById('authorFilter');
    select.innerHTML = '<option value="">All Authors</option>';
    authors.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a; opt.textContent = a;
      select.appendChild(opt);
    });
  } catch {}
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderBooks(books) {
  const grid    = document.getElementById('booksGrid');
  const noRes   = document.getElementById('noResults');
  const countEl = document.getElementById('resultsCount');

  countEl.textContent = books.length > 0 ? `Showing ${books.length} book${books.length !== 1 ? 's' : ''}` : '';
  if (books.length === 0) { grid.innerHTML = ''; noRes.classList.remove('hidden'); return; }
  noRes.classList.add('hidden');

  grid.innerHTML = books.map(book => {
    const ai  = aiFallbackUrl(book.title, book.author, book.category);
    const src = book.image || ai;
    const id  = book._id; // MongoDB _id
    return `
    <div class="book-card">
      <div class="book-img-wrap">
        <img class="book-cover" src="${src}" alt="${book.title}" loading="lazy"
             onerror="this.onerror=null;this.src='${ai}'">
      </div>
      <div class="book-info">
        <div class="book-title">${book.title}</div>
        <div class="book-author">by ${book.author}</div>
        <span class="book-category" data-cat="${book.category}">${book.category}</span>
        <div class="book-prices">
          <div class="price-tag">Rent: <strong>₹${book.rentPrice}/day</strong></div>
          <div class="price-tag">Buy: <strong>₹${book.buyPrice}</strong></div>
        </div>
      </div>
      <div class="book-actions">
        <button class="btn-rent" onclick="openRentModal('${id}')">📅 Rent</button>
        <button class="btn-buy"  onclick="openBuyModal('${id}')">🛒 Buy</button>
        <button class="btn-cart" onclick="addToCartQuick('${id}')">+ Cart</button>
      </div>
    </div>`;
  }).join('');
}

// ── Filter ────────────────────────────────────────────────────────────────────
function filterBooks() {
  const q        = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const author   = document.getElementById('authorFilter').value;
  const filtered = allBooks.filter(b =>
    b.title.toLowerCase().includes(q) &&
    (!category || b.category === category) &&
    (!author   || b.author   === author)
  );
  renderBooks(filtered);
}

// ── Rent Modal ────────────────────────────────────────────────────────────────
function openRentModal(bookId) {
  currentBook = allBooksMap[String(bookId)];
  if (!currentBook) { showToast('Book not found. Please refresh.'); return; }
  document.getElementById('rentBookTitle').textContent = `"${currentBook.title}" by ${currentBook.author}`;
  document.getElementById('rentRateInfo').textContent  = `Rental rate: ₹${currentBook.rentPrice} per day`;
  document.getElementById('rentDays').value = 1;
  document.getElementById('err-rentDays').textContent  = '';
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  calcRent();
  document.getElementById('rentModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function changeDays(delta) {
  const inp = document.getElementById('rentDays');
  inp.value = Math.max(1, (parseInt(inp.value) || 1) + delta);
  calcRent();
}

function setDays(n) {
  document.getElementById('rentDays').value = n;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  calcRent();
}

function calcRent() {
  if (!currentBook) return;
  const days  = parseInt(document.getElementById('rentDays').value) || 0;
  const total = days * currentBook.rentPrice;
  document.getElementById('feeRate').textContent  = `₹${currentBook.rentPrice}/day`;
  document.getElementById('feeDays').textContent  = `${days} day${days !== 1 ? 's' : ''}`;
  document.getElementById('feeTotal').textContent = `₹${total}`;
}

async function confirmRent() {
  const days  = parseInt(document.getElementById('rentDays').value) || 0;
  const errEl = document.getElementById('err-rentDays');
  if (days < 1)   { errEl.textContent = 'Please enter at least 1 day.'; return; }
  if (days > 365) { errEl.textContent = 'Maximum rental period is 365 days.'; return; }
  errEl.textContent = '';
  try {
    await CartAPI.add(String(currentBook._id), 'rent', days);
    updateCartBadge();
    closeModal();
    showToast(`✅ "${currentBook.title}" rented for ${days} day(s) — ₹${days * currentBook.rentPrice}`);
  } catch (err) { showToast('Error: ' + err.message); }
}

function closeModal() {
  document.getElementById('rentModal').classList.add('hidden');
  document.body.style.overflow = '';
  currentBook = null;
}

// ── Buy Modal ─────────────────────────────────────────────────────────────────
function openBuyModal(bookId) {
  currentBuyBook = allBooksMap[String(bookId)];
  if (!currentBuyBook) { showToast('Book not found. Please refresh.'); return; }
  document.getElementById('buyBookTitle').textContent = `"${currentBuyBook.title}" by ${currentBuyBook.author}`;
  document.getElementById('buyPrice').textContent     = `₹${currentBuyBook.buyPrice}`;
  document.getElementById('buyTotal').textContent     = `₹${currentBuyBook.buyPrice}`;
  document.getElementById('buyModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

async function confirmBuy() {
  try {
    await CartAPI.add(String(currentBuyBook._id), 'buy');
    updateCartBadge();
    closeBuyModal();
    showToast(`✅ "${currentBuyBook.title}" added to cart for purchase!`);
  } catch (err) { showToast('Error: ' + err.message); }
}

function closeBuyModal() {
  document.getElementById('buyModal').classList.add('hidden');
  document.body.style.overflow = '';
  currentBuyBook = null;
}

async function addToCartQuick(bookId) {
  try {
    await CartAPI.add(String(bookId), 'cart');
    updateCartBadge();
    showToast('✅ Added to cart!');
  } catch (err) { showToast('Error: ' + err.message); }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('bb-toast');
  if (!t) { t = document.createElement('div'); t.id = 'bb-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

// Modal close handlers
document.getElementById('rentModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('buyModal').addEventListener('click',  e => { if (e.target === e.currentTarget) closeBuyModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeBuyModal(); } });

init();
