const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi Rahasia
const JWT_SECRET = process.env.JWT_SECRET || "KODE_RAHASIA_INDUSTRI_2024";

// Koneksi MongoDB
// Ganti bagian koneksi di server.js menjadi seperti ini:
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/warehouse_pro';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error(err));
// --- SKEMA DATABASE ---

// 1. Master Produk
const ProductSchema = new mongoose.Schema({
  sku: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  category: String,
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 5 },
  location: { type: String, default: "Gudang Utama" },
  updatedAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', ProductSchema);

// 2. Stok Detail (Untuk FIFO)
const Stock = mongoose.model('Stock', new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, required: true },
  receivedAt: { type: Date, default: Date.now }
}));

// 3. User
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'PICKER', 'CHECKER'], default: 'PICKER' }
}));

// --- MIDDLEWARE KEAMANAN ---
const auth = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: "Akses Ditolak" });

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Role tidak diizinkan" });
      }
      req.user = decoded;
      next();
    } catch (err) {
      res.status(400).json({ message: "Token Invalid" });
    }
  };
};

// --- ROUTES AUTH ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({ ...req.body, password: hashedPassword });
    await user.save();
    res.json({ message: "User Terdaftar" });
  } catch (err) {
    res.status(400).json({ message: "Username sudah digunakan" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(400).json({ message: "Login Gagal" });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, role: user.role, username: user.username });
});

// --- ROUTES OPERASIONAL ---

// 1. Ambil Semua Produk
app.get('/api/products', auth(), async (req, res) => {
  try {
    const products = await Product.find().sort({ updatedAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil data" });
  }
});

// 2. Tambah Produk Baru (Inbound)
app.post('/api/products', auth(['ADMIN']), async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();

    // Simpan ke stok detail juga untuk FIFO
    if (newProduct.stock > 0) {
      const initialStock = new Stock({
        productId: newProduct._id,
        quantity: newProduct.stock
      });
      await initialStock.save();
    }
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: "SKU Duplikat!" });
  }
});

// 3. Update Produk (Edit) — FIX: route PUT yang sebelumnya tidak ada
app.put('/api/products/:id', auth(['ADMIN']), async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Gagal update produk" });
  }
});

// 4. Hapus Produk
app.delete('/api/products/:id', auth(['ADMIN']), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await Stock.deleteMany({ productId: req.params.id });
    res.json({ message: "Berhasil Dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal Hapus" });
  }
});

// 5. FIFO Outbound (Pengurangan Stok)
app.post('/api/outbound', auth(['ADMIN', 'PICKER']), async (req, res) => {
  const { productId, qtyToPick } = req.body;
  try {
    const stocks = await Stock.find({ productId, quantity: { $gt: 0 } }).sort({ receivedAt: 1 });
    let remaining = qtyToPick;

    for (let s of stocks) {
      if (remaining <= 0) break;
      if (s.quantity >= remaining) {
        s.quantity -= remaining;
        remaining = 0;
      } else {
        remaining -= s.quantity;
        s.quantity = 0;
      }
      await s.save();
    }

    if (remaining > 0) return res.status(400).json({ message: "Stok kurang!" });

    await Product.findByIdAndUpdate(productId, { $inc: { stock: -qtyToPick } });
    res.json({ message: "FIFO Outbound Berhasil" });
  } catch (err) {
    res.status(500).json({ message: "Sistem Error" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));