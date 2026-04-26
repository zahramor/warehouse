const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 10 }, // Batas notifikasi stok rendah
  unit: { type: String, default: 'Pcs' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);