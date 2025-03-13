import React, { useState, useEffect } from 'react'; 
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL);// ใช้ environment variable

const App = () => {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [history, setHistory] = useState([]);

  // ดึงประวัติการคลิกจาก backend
  useEffect(() => {
    fetchHistory();
    socket.on('updateClicks', fetchHistory); // ฟัง event อัปเดตคลิก
    return () => socket.off('updateClicks'); // เคลียร์เมื่อคอมโพเนนต์ไม่ใช้งาน
  }, []);

  // ฟังก์ชันสำหรับส่ง URL ไป backend และรับผลลัพธ์
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${import.meta.env.VITE_BACKEND_URL}/urls?url=${url}`) // ใช้ environment variable
      .then(res => res.json())
      .then(data => {
        setShortUrl(data.shortUrl);
        setQrCode(data.qrCode);
        setUrl('');
      });
  };

  // ฟังก์ชันดึงประวัติการคลิก
  const fetchHistory = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/history`) // ใช้ environment variable
      .then(res => res.json())
      .then(setHistory);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 p-10">
      <div className="w-1/2 pr-8 flex flex-col space-y-6">
        <h1 className="text-4xl font-bold text-blue-700 text-center">Short URL Generator</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-full space-y-4">
          <input 
            type="url" 
            placeholder="Enter URL here..." 
            className="w-full p-3 border rounded-lg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">
            Generate Short URL
          </button>
        </form>

        {shortUrl && (
          <div className="bg-white p-6 rounded-lg shadow-lg text-center space-y-4">
            <p className="text-lg font-semibold">Your Short URL:</p>
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
              {shortUrl}
            </a>
            <img src={qrCode} alt="QR Code" className="mx-auto w-40" />
          </div>
        )}
      </div>

      <div className="w-1/2 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">URL History</h2>
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 border">Original URL</th>
              <th className="p-3 border">Short URL</th>
              <th className="p-3 border">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="p-3 border break-all">{item.org_url}</td>
                <td className="p-3 border">
                  <a href={item.short_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {item.short_url}
                  </a>
                </td>
                <td className="p-3 border text-center">{item.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
