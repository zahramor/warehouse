
WMS-PRO adalah aplikasi manajemen inventaris berbasis web yang dirancang untuk memudahkan pemantauan stok gudang secara akurat dan efisien.

Fitur Utama
Multi-Role Access: Mendukung role Admin, Picker, dan Checker dengan hak akses berbeda.
Inventory Management: Tambah, edit, dan hapus barang dengan detail lokasi nomor rak.
Real-time Dashboard: Visualisasi grafik stok menggunakan Recharts.
FIFO System: Alur barang masuk dan keluar yang tersinkronisasi.
Export Reports: Generate laporan stok instan dalam format PDF.
Cloud Database: Terintegrasi dengan MongoDB Atlas untuk keamanan data.

Tech Stack
Frontend: React.js, Tailwind CSS, Lucide React (Icons), Recharts.
Backend: Node.js, Express.js.
Database: MongoDB (Atlas).
Authentication: JSON Web Token (JWT) & BcryptJS.
Deployment: Render (Backend) & Netlify (Frontend).

Cara Menjalankan Secara Lokal
1. Clone repository ini.
2. Jalankan `npm install` di folder root dan client.
3. Sesuaikan `MONGO_URI` di file server.
4. Jalankan `node server.js` (Server) dan `npm start` (Client).
