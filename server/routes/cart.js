const express = require('express');
const Cart    = require('../models/Cart');
const Book    = require('../models/Book');
const auth    = require('../middleware/auth');

const router  = express.Router();

// ── GET /api/cart ─────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.book', 'title author image rentPrice buyPrice category');
    res.json({ cart: cart || { items: [] } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/cart/add ────────────────────────────────────────────────────────
router.post('/add', auth, async (req, res) => {
  const { bookId, type, days } = req.body;

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const price = type === 'buy' ? book.buyPrice : (days ? days * book.rentPrice : book.rentPrice);

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    cart.items.push({ book: bookId, type, days: days || null, price });
    await cart.save();

    await cart.populate('items.book', 'title author image rentPrice buyPrice category');
    res.json({ cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/cart/item/:itemId ─────────────────────────────────────────────
router.delete('/item/:itemId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    await cart.save();
    await cart.populate('items.book', 'title author image rentPrice buyPrice category');
    res.json({ cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/cart/clear ────────────────────────────────────────────────────
router.delete('/clear', auth, async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
