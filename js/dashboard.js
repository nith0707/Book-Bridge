const session = Auth.user();
const role    = session?.role || 'reader';

document.getElementById('welcomeUser').textContent = session?.username || 'User';
document.getElementById('roleBadge').innerHTML = role === 'writer'
  ? '<span class="rbadge rbadge--writer">✍️ Writer</span>'
  : '<span class="rbadge rbadge--reader">📖 Reader</span>';
document.getElementById('welcomeSub').textContent = role === 'writer'
  ? 'Manage and list your books for the community.'
  : 'Discover, rent and buy books you love.';

buildNav('dashboard');

// Cards
const cards = document.getElementById('dashCards');
if (role === 'writer') {
  cards.innerHTML = `
    <a href="add-book.html" class="dash-card">
      <div class="dash-card-icon">➕</div>
      <h3>Add a Book</h3>
      <p>List your book for others to rent or buy</p>
    </a>
    <div class="dash-card dash-card--info">
      <div class="dash-card-icon">📊</div>
      <h3>Your Listings</h3>
      <p id="writerListingCount">Loading…</p>
    </div>`;
} else {
  cards.innerHTML = `
    <a href="browse.html" class="dash-card">
      <div class="dash-card-icon">📖</div>
      <h3>Browse Books</h3>
      <p>Explore books available for rent or purchase</p>
    </a>
    <a href="cart.html" class="dash-card">
      <div class="dash-card-icon">🛒</div>
      <h3>View Cart</h3>
      <p>Review items you've added to your cart</p>
    </a>`;
}

async function loadStats() {
  const statsRow = document.getElementById('statsRow');
  try {
    const books = await Books.getAll();

    if (role === 'writer') {
      const mine = books.filter(b =>
        b.addedBy?.username === session?.username ||
        b.addedBy?._id      === session?._id
      ).length;

      const el = document.getElementById('writerListingCount');
      if (el) el.textContent = `${mine} book${mine !== 1 ? 's' : ''} listed by you`;

      statsRow.innerHTML = `
        <div class="stat-box"><span>${mine}</span><label>Your Listings</label></div>
        <div class="stat-box"><span>${books.length}</span><label>Total on Platform</label></div>`;
    } else {
      // Reader — also load cart count
      let cartCount = 0;
      try {
        const cart = await CartAPI.get();
        cartCount = cart?.items?.length || 0;
      } catch {}

      statsRow.innerHTML = `
        <div class="stat-box"><span>${books.length}</span><label>Books Available</label></div>
        <div class="stat-box"><span>${cartCount}</span><label>Cart Items</label></div>`;
    }
  } catch (err) {
    console.error('Stats error:', err.message);
    if (statsRow) statsRow.innerHTML = '';
  }
}

loadStats();
