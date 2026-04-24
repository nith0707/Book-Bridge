buildNav('cart');

async function renderCart() {
  const emptyEl   = document.getElementById('cartEmpty');
  const contentEl = document.getElementById('cartContent');
  const itemsEl   = document.getElementById('cartItems');

  try {
    const cart = await CartAPI.get();
    updateCartBadge();

    if (!cart || cart.items.length === 0) {
      emptyEl.classList.remove('hidden');
      contentEl.style.display = 'none';
      return;
    }

    emptyEl.classList.add('hidden');
    contentEl.style.display = 'grid';

    const total = cart.items.reduce((s, i) => s + i.price, 0);
    document.getElementById('totalItems').textContent = cart.items.length;
    document.getElementById('grandTotal').textContent = `₹${total.toFixed(2)}`;

    itemsEl.innerHTML = cart.items.map(item => {
      const book = item.book;
      const ai   = `https://image.pollinations.ai/prompt/${encodeURIComponent('book cover ' + book.title)}?width=70&height=90&nologo=true`;
      const src  = book.image || ai;
      return `
      <div class="cart-item">
        <img class="cart-item-img" src="${src}" alt="${book.title}"
             onerror="this.onerror=null;this.src='${ai}'">
        <div class="cart-item-info">
          <div class="cart-item-title">${book.title}</div>
          <div class="cart-item-meta">by ${book.author}</div>
          <span class="cart-item-type ${item.type === 'rent' ? 'type-rent' : 'type-buy'}">
            ${item.type === 'rent' ? `Rent · ${item.days} day(s)` : 'Buy'}
          </span>
          <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
        </div>
        <button class="btn-danger" onclick="removeItem('${item._id}')">Remove</button>
      </div>`;
    }).join('');

  } catch (err) {
    showToast('❌ Failed to load cart: ' + err.message);
  }
}

async function removeItem(itemId) {
  try {
    await CartAPI.removeItem(itemId);
    renderCart();
  } catch (err) { showToast('Error: ' + err.message); }
}

async function clearCart() {
  if (!confirm('Clear all items from your cart?')) return;
  try {
    await CartAPI.clear();
    renderCart();
  } catch (err) { showToast('Error: ' + err.message); }
}

// ── Razorpay Checkout ─────────────────────────────────────────────────────────
async function checkout() {
  const btn = document.getElementById('checkoutBtn');
  btn.textContent = 'Creating order…';
  btn.disabled = true;

  let order;
  try {
    order = await Orders.create();
  } catch (err) {
    showToast('❌ ' + err.message);
    btn.textContent = 'Proceed to Checkout';
    btn.disabled = false;
    return;
  }

  const user = Auth.user();

  const options = {
    key:         order.keyId,
    amount:      order.amount,       // in paise
    currency:    order.currency || 'INR',
    name:        'Book Bridge',
    description: 'Book Rental & Purchase',
    image:       'https://img.icons8.com/emoji/96/books-emoji.png',
    order_id:    order.orderId,

    // ── Enable ALL payment methods ──────────────────────────────────────────
    method: {
      upi:         true,   // UPI (PhonePe, GPay, Paytm, BHIM)
      card:        true,   // Credit / Debit cards
      netbanking:  true,   // Net Banking (all major banks)
      wallet:      true,   // Paytm, Mobikwik, Freecharge etc.
      emi:         true,   // EMI on cards
      paylater:    true,   // Pay Later (LazyPay, ICICI PayLater)
    },

    // Pre-fill user details
    prefill: {
      name:    user?.name  || '',
      email:   user?.email || '',
      contact: '',          // user can fill phone in checkout
    },

    // UPI deep-links — shows PhonePe, GPay, Paytm as quick options
    config: {
      display: {
        blocks: {
          utib: { name: 'Pay via UPI', instruments: [
            { method: 'upi', flows: ['qr', 'intent', 'collect', 'sdk'] },
          ]},
          other: { name: 'Other Payment Methods', instruments: [
            { method: 'card' },
            { method: 'netbanking' },
            { method: 'wallet' },
            { method: 'emi' },
            { method: 'paylater' },
          ]},
        },
        sequence: ['block.utib', 'block.other'],
        preferences: { show_default_blocks: false },
      },
    },

    theme: {
      color:        '#6c63ff',
      backdrop_color: 'rgba(0,0,0,0.75)',
    },

    // ── Success handler ─────────────────────────────────────────────────────
    handler: async (response) => {
      showToast('⏳ Verifying payment…');
      try {
        await Orders.verify({
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature:  response.razorpay_signature,
        });
        showSuccessScreen();
      } catch (err) {
        showToast('❌ Payment verification failed: ' + err.message);
        btn.textContent = 'Proceed to Checkout';
        btn.disabled = false;
      }
    },

    modal: {
      ondismiss: () => {
        showToast('Payment cancelled.');
        btn.textContent = 'Proceed to Checkout';
        btn.disabled = false;
      },
      confirm_close:  true,
      escape:         false,
      animation:      true,
    },

    retry: { enabled: true, max_count: 3 },
  };

  const rzp = new Razorpay(options);

  rzp.on('payment.failed', (resp) => {
    const reason = resp.error.description || resp.error.reason || 'Payment failed';
    showToast('❌ ' + reason);
    btn.textContent = 'Proceed to Checkout';
    btn.disabled = false;
  });

  rzp.open();
}

// ── Success screen after payment ──────────────────────────────────────────────
function showSuccessScreen() {
  const contentEl = document.getElementById('cartContent');
  const emptyEl   = document.getElementById('cartEmpty');
  emptyEl.classList.add('hidden');
  contentEl.style.display = 'none';

  const main = document.querySelector('.cart-main');
  const div  = document.createElement('div');
  div.className = 'payment-success';
  div.innerHTML = `
    <div class="success-icon">🎉</div>
    <h2>Payment Successful!</h2>
    <p>Your books have been added to your library.</p>
    <div class="success-actions">
      <a href="browse.html" class="btn-primary">Browse More Books</a>
      <a href="dashboard.html" class="btn-secondary">Go to Dashboard</a>
    </div>`;
  main.appendChild(div);

  updateCartBadge();
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('bb-toast');
  if (!t) { t = document.createElement('div'); t.id = 'bb-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 4000);
}

renderCart();
