const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  book:      { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  type:      { type: String, enum: ['rent', 'buy', 'cart'], required: true },
  days:      { type: Number, default: null },   // only for rent
  price:     { type: Number, required: true },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
