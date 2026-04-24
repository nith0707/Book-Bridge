require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');

const authRoutes  = require('./routes/auth');
const bookRoutes  = require('./routes/books');
const cartRoutes  = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const uploadRoutes= require('./routes/upload');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
// Allow all common local dev origins
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (curl, Postman) or matching origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// Raw body needed for Razorpay webhook signature verification
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/books',  bookRoutes);
app.use('/api/cart',   cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// One-time seed endpoint (disable after first use)
app.get('/api/seed', async (_, res) => {
  try {
    const Book = require('./models/Book');
    const count = await Book.countDocuments();
    if (count > 0) return res.json({ message: `Already seeded: ${count} books` });
    require('./scripts/seedBooks'); // runs the seed
    res.json({ message: 'Seeding started — check logs' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ── Connect DB then start ─────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB connection error:', err); process.exit(1); });
