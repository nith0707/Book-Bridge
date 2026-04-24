const express = require('express');
const { body, validationResult } = require('express-validator');
const Book    = require('../models/Book');
const auth    = require('../middleware/auth');
const role    = require('../middleware/role');

const router  = express.Router();

// ── GET /api/books  — public, supports ?category=&author=&q= ─────────────────
router.get('/', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.author)   filter.author   = req.query.author;
    if (req.query.q)        filter.$text    = { $search: req.query.q };

    const books = await Book.find(filter).populate('addedBy', 'username name').sort({ createdAt: -1 });
    res.json({ books });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/books/authors — distinct author list ─────────────────────────────
router.get('/authors', async (req, res) => {
  try {
    const authors = await Book.distinct('author', { isActive: true });
    res.json({ authors: authors.sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/books/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('addedBy', 'username name');
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/books — writer only ─────────────────────────────────────────────
router.post('/', auth, role('writer'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('category').isIn(['Thriller','Philosophical','RomCom','FanFiction','Education','BTech CSE']),
  body('rentPrice').isFloat({ min: 0 }).withMessage('Rent price must be a positive number'),
  body('buyPrice').isFloat({ min: 0 }).withMessage('Buy price must be a positive number'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const book = await Book.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/books/:id — writer (own book) or admin ───────────────────────────
router.put('/:id', auth, role('writer'), async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, addedBy: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found or not yours' });

    Object.assign(book, req.body);
    await book.save();
    res.json({ book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/books/:id ─────────────────────────────────────────────────────
router.delete('/:id', auth, role('writer'), async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, addedBy: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found or not yours' });
    book.isActive = false;
    await book.save();
    res.json({ message: 'Book removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
