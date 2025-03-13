const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const QRCode = require('qrcode');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const port = 8000;
// const ip = '192.168.70.156';
const ip = 'gleaming-cough-production.up.railway.app';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: '*',  // ปรับที่อยู่ที่สามารถเข้าถึงได้ถ้าไม่ต้องการให้ทุกที่เข้าถึง
      methods: ['GET', 'POST']
    }
  });
  

app.use(cors());
app.use(express.json());

console.log('MongoDB URI:', process.env.MONGODB_URI);


// เชื่อมต่อกับ MongoDB
// mongoose.connect('mongodb://localhost:27017/url_shortener')
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch((err) => console.log('Connection Error:', err));


// สร้าง Schema สำหรับ URL Shortener
const urlSchema = new mongoose.Schema({
  org_url: String,
  short_code: String,
  clicks: { type: Number, default: 0 }
});

const Url = mongoose.model('Url', urlSchema);

// สร้าง Short URL และ QR Code
app.get('/urls', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('URL is required');

  try {
    // ค้นหาว่า URL นี้เคยมีอยู่แล้วหรือไม่
    let result = await Url.findOne({ org_url: url });
    let shortCode = result ? result.short_code : Math.random().toString(36).substring(2, 8);
    const shortUrl = `http://${ip}:8000/${shortCode}`;

    // ถ้า URL ยังไม่มีในฐานข้อมูล, ให้เพิ่มเข้าไป
    if (!result) {
      result = new Url({ org_url: url, short_code: shortCode });
      await result.save();
    }

    // สร้าง QR Code
    QRCode.toDataURL(shortUrl, (err, qrCode) => {
      if (err) return res.status(500).send('QR generation error');
      res.json({ shortUrl, qrCode });
      io.emit('updateClicks');
    });
  } catch (err) {
    return res.status(500).send('Server error');
  }
});

// ดึงประวัติการสร้าง Short URL
app.get('/history', async (req, res) => {
  try {
    const results = await Url.find().sort({ clicks: -1 });
    res.json(results.map(item => ({
      org_url: item.org_url,
      short_url: `http://${ip}:8000/${item.short_code}`,
      clicks: item.clicks
    })));
  } catch (err) {
    return res.status(500).send('Server error');
  }
});

// Redirect Short URL + เพิ่มจำนวนคลิก
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const result = await Url.findOne({ short_code: shortCode });
    if (!result) return res.status(404).send('URL not found');

    // อัปเดตจำนวนคลิก
    result.clicks += 1;
    await result.save();

    io.emit('updateClicks');
    res.redirect(result.org_url);
  } catch (err) {
    return res.status(500).send('Server error');
  }
});

server.listen(port, () => console.log('Listening on port ' + port));
