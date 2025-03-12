const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const QRCode = require('qrcode');
const http = require('http');
const { Server } = require('socket.io');

const port = 8000;
const ip = '192.168.70.156';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'url' });
db.connect((err) => { if (err) throw err; console.log('MySQL Connected...'); });

// สร้าง Short URL และ QR Code
app.get('/urls', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('URL is required');

  db.query('SELECT short_code FROM urls WHERE org_url = ?', [url], (err, results) => {
    if (err) return res.status(500).send('Server error');

    const shortCode = results.length ? results[0].short_code : Math.random().toString(36).substring(2, 8);
    const shortUrl = `http://${ip}:8000/${shortCode}`;

    if (!results.length) {
      db.query('INSERT INTO urls (org_url, short_code, clicks) VALUES (?, ?, 0)', [url, shortCode]);
    }

    QRCode.toDataURL(shortUrl, (err, qrCode) => {
      if (err) return res.status(500).send('QR generation error');
      res.json({ shortUrl, qrCode });
      io.emit('updateClicks');
    });
  });
});

// ดึงประวัติการสร้าง Short URL
app.get('/history', (req, res) => {
  db.query('SELECT org_url, short_code, clicks FROM urls ORDER BY clicks DESC', (err, results) => {
    if (err) return res.status(500).send('Server error');
    res.json(results.map(item => ({ ...item, short_url: `http://${ip}:8000/${item.short_code}` })));
  });
});

// Redirect Short URL + เพิ่มจำนวนคลิก
app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;

  db.query('SELECT org_url FROM urls WHERE short_code = ?', [shortCode], (err, results) => {
    if (err || !results.length) return res.status(404).send('URL not found');

    db.query('UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?', [shortCode]);
    io.emit('updateClicks');
    res.redirect(results[0].org_url);
  });
});

server.listen(port, () => console.log('Listening on port ' + port));
