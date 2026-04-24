const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  author:      { type: String, required: true, trim: true },
  category:    { type: String, required: true, enum: ['Thriller','Philosophical','RomCom','FanFiction','Education','BTech CSE'] },
  rentPrice:   { type: Number, required: true, min: 0 },
  buyPrice:    { type: Number, required: true, min: 0 },
  image:       { type: String, default: '' },          // Cloudinary URL
  coverPublicId: { type: String, default: '' },        // Cloudinary public_id for deletion
  isbn:        { type: String, default: '' },
  description: { type: String, default: '' },
  manuscriptUrl: { type: String, default: '' },  // Cloudinary PDF URL
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

bookSchema.index({ title: 'text', author: 'text' });

module.exports = mongoose.model('Book', bookSchema);
