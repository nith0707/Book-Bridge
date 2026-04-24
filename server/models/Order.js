const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  book:    { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  type:    { type: String, enum: ['rent', 'buy'] },
  days:    { type: Number, default: null },
  price:   { type: Number },
});

const orderSchema = new mongoose.Schema({
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:             [orderItemSchema],
  totalAmount:       { type: Number, required: true },
  razorpayOrderId:   { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  status:            { type: String, enum: ['created','paid','failed'], default: 'created' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
