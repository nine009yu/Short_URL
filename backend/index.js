const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const QRCode = require('qrcode');
const http = require('http');
const { Server } = require('socket.io');
const validUrl = require('valid-url'); // ตรวจสอบ URL ที่รับเข้ามา
require('dotenv').config();

const port = process.env.PORT || 8000; // พอร์ตที่ใช้จะถูกกำหนดจาก Railway
const ip = process.env.SERVER_IP || 'localhost'; // ใช้ localhost สำหรับการทดสอบในเครื่อง
const railwayUrl = process.env.RAILWAY_URL || 'localhost'; // ใช้ URL ที่ได้จาก Railway ถ้ารันบนคลาวด์

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'https://shorturl-production-6100.up.railway.app', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

console.log('MongoDB URI:', process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

const urlSchema = new mongoose.Schema({
  org_url: String,
  short_code: String,
  clicks: { type: Number, default: 0 },
});

const Url = mongoose.model('Url', urlSchema);

app.get('/', async (req, res) => {
  // ส่งข้อความเพื่อทดสอบว่าเซิร์ฟเวอร์ทำงานได้
  res.send('Hello, world!');
});

// 🎯 API: สร้าง Short URL และ QR Code
app.get('/urls', async (req, res) => {
  const url = req.query.url;

  if (!url || !validUrl.isUri(url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    let result = await Url.findOne({ org_url: url });
    let shortCode = result ? result.short_code : Math.random().toString(36).substring(2, 8);
    // ใช้ URL ของ Railway โดยไม่ต้องใช้พอร์ต
    const shortUrl = `https://${railwayUrl}/${shortCode}`;

    if (!result) {
      result = new Url({ org_url: url, short_code: shortCode });
      await result.save();
    }

    QRCode.toDataURL(shortUrl, (err, qrCode) => {
      if (err) {
        console.error('❌ QR Code Generation Error:', err);
        return res.status(500).json({ error: 'QR generation error' });
      }
      res.json({ shortUrl, qrCode });
      io.emit('updateClicks');
    });
  } catch (err) {
    console.error('❌ Server Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// 🎯 API: ดึงประวัติ URL
app.get('/history', async (req, res) => {
  try {
    const results = await Url.find().sort({ clicks: -1 });
    res.json(results.length ? results.map((item) => ({
      org_url: item.org_url,
      short_url: `https://${railwayUrl}/${item.short_code}`,
      clicks: item.clicks,
    })) : []);
  } catch (err) {
    console.error('❌ Error fetching history:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// 🎯 API: Redirect และเพิ่มจำนวนคลิก
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  try {
    const result = await Url.findOne({ short_code: shortCode });
    if (!result) return res.status(404).json({ error: 'URL not found' });

    result.clicks += 1;
    await result.save();
    io.emit('updateClicks');
    res.redirect(result.org_url);
  } catch (err) {
    console.error('❌ Redirect Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

server.listen(port, () => console.log(`🚀 Server running at https://${railwayUrl}`)); // ใช้ URL ของ Railway แทนพอร์ต
