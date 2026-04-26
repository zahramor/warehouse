// server/models/Schemas.js

// 1. MASTER BARANG (Produk)
const ProductSchema = new mongoose.Schema({
  sku: { type: String, unique: true },
  name: String,
  category: String,
  unit: String, // Pcs, Box, Pallet
  minStock: Number
});

// 2. STOK BERDASARKAN LOKASI (Rak/Bin) & METODE (FIFO)
const StockSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  location: String, // Contoh: RAK-A1, BIN-02
  batchNumber: String, // Untuk FEFO/FIFO
  quantity: Number,
  expiryDate: Date,
  receivedAt: { type: Date, default: Date.now }
});

// 3. TRANSAKSI/LOG (History)
const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['INBOUND', 'OUTBOUND', 'TRANSFER'] },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  qty: Number,
  fromLocation: String,
  toLocation: String,
  staffName: String,
  timestamp: { type: Date, default: Date.now }
});