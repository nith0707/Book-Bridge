let allBooks     = [];
let allBooksMap  = {};
let currentBook  = null;
let currentBuyBook = null;

buildNav('browse');

async function init() {
  await Promise.all([loadBooks(), loadAuthors()]);
}

async function loadBooks() {
  try {
    const books = await Books.getAll();
    allBooks = books || [];
    allBooksMap = {};
    allBooks.forEach(b => {
      if (b && b._id) allBooksMap[String(b._id)] = b;
    });
    renderBooks(allBooks);
  } catch (err) {
    showToast('Failed to load books. Is the server running?');
    console.error(err);
  }
}

async function loadAuthors() {
  try {
    const authors = await Books.getAuthors();
    const select  = document.getElementById('authorFilter');
    if (!select) return;
    select.innerHTML = '<option value="">All Authors</option>';
    (authors || []).forEach(a => {
      const opt = document.createElement('option');
      opt.value = a; opt.textContent = a;
      select.appendChild(opt);
    });
  } catch {}
}

function renderBooks(books) {
  const grid    = document.getElementById('booksGrid');
  const noRes   = document.getElementById('noResults');
  const countEl = document.getElementById('resultsCount');
  if (!grid) return;

  countEl.textContent = books.length > 0
    ? `Showing ${books.length} book${books.length !== 1 ? 's' : ''}` : '';

  if (books.length === 0) {
    grid.innerHTML = '';
    noRes.classList.remove('hidden');
    return;
  }
  noRes.classList.add('hidden');

  grid.innerHTML = books.map(book => {
    if (!book) return '';
    const id  = String(book._id);
    const ai  = aiFallbackUrl(book.title, book.author, book.category);
    const src = book.image || ai;
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

function filterBooks() {
  const q        = (document.getElementById('searchInput').value || '').toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const author   = document.getElementById('authorFilter').value;
  const filtered = allBooks.filter(b =>
    b &&
    b.title.toLowerCase().includes(q) &&
    (!category || b.category === category) &&
    (!author   || b.author   === author)
  );
  renderBooks(filtered);
}

// ── RENT MODAL ────────────────────────────────────────────────────────────────
function openRentModal(bookId) {
  const book = allBooksMap[String(bookId)];
  if (!book) {
    showToast('Could not find book. Please refresh the page.');
    return;
  }
  currentBook = book;
  document.getElementById('rentBookTitle').textContent = `"${book.title}" by ${book.author}`;
  document.getElementById('rentRateInfo').textContent  = `Rental rate: ₹${book.rentPrice} per day`;
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
  if (event && event.target) event.target.classList.add('active');
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
  if (!currentBook) { showToast('No book selected.'); return; }
  const days  = parseInt(document.getElementById('rentDays').value) || 0;
  const errEl = document.getElementById('err-rentDays');
  if (days < 1)   { errEl.textContent = 'Please enter at least 1 day.'; return; }
  if (days > 365) { errEl.textContent = 'Maximum rental period is 365 days.'; return; }
  errEl.textContent = '';
  try {
    await CartAPI.add(String(currentBook._id), 'rent', days);
    updateCartBadge();
    const msg = `✅ "${currentBook.title}" rented for ${days} day(s) — ₹${days * currentBook.rentPrice}`;
    closeModal();
    showToast(msg);
  } catch (err) {
    showToast('Error: ' + (err.message || 'Something went wrong'));
  }
}

function closeModal() {
  document.getElementById('rentModal').classList.add('hidden');
  document.body.style.overflow = '';
  currentBook = null;
}

// ── BUY MODAL ─────────────────────────────────────────────────────────────────
function openBuyModal(bookId) {
  const book = allBooksMap[String(bookId)];
  if (!book) {
    showToast('Could not find book. Please refresh the page.');
    return;
  }
  currentBuyBook = book;
  document.getElementById('buyBookTitle').textContent = `"${book.title}" by ${book.author}`;
  document.getElementById('buyPrice').textContent     = `₹${book.buyPrice}`;
  document.getElementById('buyTotal').textContent     = `₹${book.buyPrice}`;
  document.getElementById('buyModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

async function confirmBuy() {
  if (!currentBuyBook) { showToast('No book selected.'); return; }
  try {
    await CartAPI.add(String(currentBuyBook._id), 'buy');
    updateCartBadge();
    const msg = `✅ "${currentBuyBook.title}" added to cart!`;
    closeBuyModal();
    showToast(msg);
  } catch (err) {
    showToast('Error: ' + (err.message || 'Something went wrong'));
  }
}

function closeBuyModal() {
  document.getElementById('buyModal').classList.add('hidden');
  document.body.style.overflow = '';
  currentBuyBook = null;
}

// ── CART ──────────────────────────────────────────────────────────────────────
async function addToCartQuick(bookId) {
  try {
    await CartAPI.add(String(bookId), 'cart');
    updateCartBadge();
    showToast('✅ Added to cart!');
  } catch (err) {
    showToast('Error: ' + (err.message || 'Something went wrong'));
  }
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('bb-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'bb-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

// close on overlay click or Escape
document.getElementById('rentModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('buyModal').addEventListener('click',  e => { if (e.target === e.currentTarget) closeBuyModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeBuyModal(); } });

init();
