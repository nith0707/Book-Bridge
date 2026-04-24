const express   = require('express');
const crypto    = require('crypto');
const Razorpay  = require('razorpay');
const Cart      = require('../models/Cart');
const Order     = require('../models/Order');
const User      = require('../models/User');
const auth      = require('../middleware/auth');

const router    = express.Router();

const razorpay  = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /api/orders/create ───────────────────────────────────────────────────
router.post('/create', auth, async (req, res) => {
  // Guard: check keys are configured
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YOUR_KEY')) {
    return res.status(503).json({
      message: 'Razorpay is not configured. Add your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env'
    });
  }
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.book', 'title buyPrice rentPrice');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const totalPaise = Math.round(
      cart.items.reduce((sum, item) => sum + item.price, 0) * 100
    );

    const rzpOrder = await razorpay.orders.create({
      amount:   totalPaise,
      currency: 'INR',
      receipt:  `receipt_${Date.now()}`,
    });

    // Save order in DB with status 'created'
    const order = await Order.create({
      user:            req.user._id,
      items:           cart.items.map(i => ({
        book:  i.book._id,
        type:  i.type,
        days:  i.days,
        price: i.price,
      })),
      totalAmount:     totalPaise / 100,
      razorpayOrderId: rzpOrder.id,
    });

    res.json({
      orderId:   rzpOrder.id,
      amount:    rzpOrder.amount,
      currency:  rzpOrder.currency,
      keyId:     process.env.RAZORPAY_KEY_ID,
      orderDbId: order._id,
      user: {
        name:  req.user.name,
        email: req.user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/orders/verify — verify payment signature after Razorpay callback ─
router.post('/verify', auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
  }

  try {
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status            = 'paid';
    await order.save();

    // Add bought books to user's library
    const buyItems = order.items.filter(i => i.type === 'buy').map(i => i.book);
    if (buyItems.length > 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { library: { $each: buyItems } },
      });
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.json({ message: 'Payment verified successfully', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/orders/webhook — Razorpay webhook (raw body) ───────────────────
router.post('/webhook', (req, res) => {
  const secret    = process.env.RAZORPAY_KEY_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body      = req.body; // raw Buffer

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSig !== signature) {
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  const event = JSON.parse(body.toString());
  console.log('Razorpay webhook event:', event.event);
  // Handle payment.captured, payment.failed etc. here if needed
  res.json({ received: true });
});

// ── GET /api/orders/my — user's order history ────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.book', 'title author image')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
