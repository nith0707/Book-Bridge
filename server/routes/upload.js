const express    = require('express');
const cloudinary = require('cloudinary').v2;
const multer     = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth       = require('../middleware/auth');
const role       = require('../middleware/role');
const Book       = require('../models/Book');

const router     = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for book covers
const coverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'bookbridge/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 560, crop: 'fill', quality: 'auto' }],
  },
});

// Cloudinary storage for manuscript PDFs
const manuscriptStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'bookbridge/manuscripts',
    allowed_formats: ['pdf'],
    resource_type:   'raw',
  },
});

const uploadCover      = multer({ storage: coverStorage,      limits: { fileSize: 5 * 1024 * 1024 } });
const uploadManuscript = multer({ storage: manuscriptStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// ── POST /api/upload/cover/:bookId ────────────────────────────────────────────
router.post('/cover/:bookId', auth, role('writer'), uploadCover.single('cover'), async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.bookId, addedBy: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found or not yours' });

    // Delete old cover from Cloudinary if exists
    if (book.coverPublicId) {
      await cloudinary.uploader.destroy(book.coverPublicId);
    }

    book.image         = req.file.path;
    book.coverPublicId = req.file.filename;
    await book.save();

    res.json({ url: req.file.path, book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/upload/manuscript/:bookId ───────────────────────────────────────
router.post('/manuscript/:bookId', auth, role('writer'), uploadManuscript.single('manuscript'), async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.bookId, addedBy: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found or not yours' });

    book.manuscriptUrl = req.file.path;
    await book.save();

    res.json({ url: req.file.path, book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
