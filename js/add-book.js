buildNav('add-book');

let selectedCategory = '';
let coverObjectUrl   = '';

// ── Category chip selector ────────────────────────────────────────────────────
function selectCategory(chip) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
  chip.classList.add('chip--active');
  selectedCategory = chip.dataset.val;
  document.getElementById('bookCategory').value = selectedCategory;
  document.getElementById('err-bookCategory').textContent = '';
  updatePreview();
}

// ── Cover file upload ─────────────────────────────────────────────────────────
function handleCoverFile(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showFieldErr('bookImage', 'File too large — max 5MB'); return;
  }
  if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl);
  coverObjectUrl = URL.createObjectURL(file);
  setCoverPreview(coverObjectUrl);
  document.getElementById('bookImage').value = ''; // clear URL field
}

// ── Cover URL input ───────────────────────────────────────────────────────────
function handleImageUrl(url) {
  if (!url) {
    setCoverPreview('');
    return;
  }
  setCoverPreview(url);
  // clear file input
  document.getElementById('coverFile').value = '';
  coverObjectUrl = '';
}

function setCoverPreview(src) {
  const img         = document.getElementById('coverPreviewImg');
  const placeholder = document.getElementById('coverPlaceholder');
  const previewCover= document.getElementById('previewCover');

  if (src) {
    img.src = src;
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');
    previewCover.src = src;
    previewCover.onerror = () => {
      previewCover.src = 'https://via.placeholder.com/300x420/1e1b3a/6c63ff?text=Cover';
    };
  } else {
    img.classList.add('hidden');
    placeholder.classList.remove('hidden');
    previewCover.src = 'https://via.placeholder.com/300x420/1e1b3a/6c63ff?text=Cover';
  }
}

// ── Live preview updater ──────────────────────────────────────────────────────
function updatePreview() {
  const title  = document.getElementById('bookTitle').value  || 'Book Title';
  const author = document.getElementById('bookAuthor').value || 'Author Name';
  const rent   = document.getElementById('rentPrice').value;
  const buy    = document.getElementById('buyPrice').value;
  const desc   = document.getElementById('bookDesc').value;

  document.getElementById('previewTitle').textContent  = title;
  document.getElementById('previewAuthor').textContent = 'by ' + author;
  document.getElementById('previewRent').textContent   = rent  ? `₹${rent}/day` : '₹—/day';
  document.getElementById('previewBuy').textContent    = buy   ? `₹${buy}`      : '₹—';
  document.getElementById('previewDesc').textContent   = desc;

  const catEl = document.getElementById('previewCategory');
  catEl.textContent    = selectedCategory || 'Category';
  catEl.dataset.cat    = selectedCategory;
}

// ── Field error helpers ───────────────────────────────────────────────────────
function showFieldErr(id, msg) {
  const el = document.getElementById('err-' + id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function clearFieldErrs() {
  document.querySelectorAll('.field-error').forEach(e => { e.textContent = ''; e.style.display = 'none'; });
  document.getElementById('addBookError').textContent = '';
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleAddBook(e) {
  e.preventDefault();
  clearFieldErrs();

  const title     = document.getElementById('bookTitle').value.trim();
  const author    = document.getElementById('bookAuthor').value.trim();
  const category  = selectedCategory;
  const rentPrice = parseFloat(document.getElementById('rentPrice').value);
  const buyPrice  = parseFloat(document.getElementById('buyPrice').value);
  const imageUrl  = document.getElementById('bookImage').value.trim();
  const desc      = document.getElementById('bookDesc').value.trim();
  const coverFile = document.getElementById('coverFile').files[0];

  let valid = true;
  if (!title)          { showFieldErr('bookTitle',    'Title is required.');              valid = false; }
  if (!author)         { showFieldErr('bookAuthor',   'Author is required.');             valid = false; }
  if (!category)       { showFieldErr('bookCategory', 'Please select a category.');       valid = false; }
  if (!rentPrice || rentPrice < 1) { showFieldErr('rentPrice', 'Enter a valid rent price.'); valid = false; }
  if (!buyPrice  || buyPrice  < 1) { showFieldErr('buyPrice',  'Enter a valid buy price.');  valid = false; }
  if (!valid) return;

  const btn = document.getElementById('submitBtn');
  btn.textContent = '⏳ Publishing…';
  btn.disabled    = true;

  try {
    // 1. Create book record
    const book = await Books.create({
      title, author, category, rentPrice, buyPrice,
      image: imageUrl, description: desc,
    });

    // 2. Upload cover file to Cloudinary if provided
    if (coverFile) {
      btn.textContent = '⏳ Uploading cover…';
      try {
        await Upload.cover(book._id, coverFile);
      } catch {
        // Cloudinary not configured — skip silently
      }
    }

    // Success
    document.getElementById('addBookSuccess').textContent = `✅ "${title}" is now live on Book Bridge!`;
    document.getElementById('addBookSuccess').classList.remove('hidden');
    document.getElementById('addBookForm').reset();
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
    selectedCategory = '';
    coverObjectUrl   = '';
    setCoverPreview('');
    updatePreview();
    loadMyListings(); // refresh listings panel

    setTimeout(() => {
      document.getElementById('addBookSuccess').classList.add('hidden');
    }, 4000);

  } catch (err) {
    document.getElementById('addBookError').textContent = '❌ ' + err.message;
  } finally {
    btn.textContent = '🚀 Publish Book';
    btn.disabled    = false;
  }
}

// ── My listings panel ─────────────────────────────────────────────────────────
async function loadMyListings() {
  const grid = document.getElementById('myListingsGrid');
  try {
    const books = await Books.getAll();
    const user  = Auth.user();
    const mine  = books.filter(b =>
      b.addedBy?.username === user?.username ||
      b.addedBy?._id      === user?._id
    );

    if (mine.length === 0) {
      grid.innerHTML = '<p class="loading-text">No books listed yet.</p>';
      return;
    }

    grid.innerHTML = mine.map(b => `
      <div class="listing-row">
        <img src="${b.image || 'https://via.placeholder.com/40x56/1e1b3a/6c63ff?text=📖'}"
             onerror="this.src='https://via.placeholder.com/40x56/1e1b3a/6c63ff?text=📖'"
             class="listing-thumb" alt="${b.title}" />
        <div class="listing-info">
          <div class="listing-title">${b.title}</div>
          <div class="listing-meta">${b.category} · ₹${b.rentPrice}/day · ₹${b.buyPrice}</div>
        </div>
        <button class="btn-danger listing-del" onclick="deleteBook('${b._id}','${b.title}')">🗑</button>
      </div>`).join('');
  } catch {
    grid.innerHTML = '<p class="loading-text">Could not load listings.</p>';
  }
}

async function deleteBook(id, title) {
  if (!confirm(`Remove "${title}" from the platform?`)) return;
  try {
    await Books.remove(id);
    loadMyListings();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// Init
updatePreview();
loadMyListings();
