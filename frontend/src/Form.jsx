import React, { useState, useEffect } from 'react'; 
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL);

const App = () => {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false); // สำหรับสลับการแสดงผล

  useEffect(() => {
    fetchHistory();
    socket.on('updateClicks', fetchHistory);
    return () => socket.off('updateClicks');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/urls?url=${url}`);
      if (!response.ok) throw new Error('Failed to generate short URL');
      const data = await response.json();
      setShortUrl(data.shortUrl);
      setQrCode(data.qrCode);
      setUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    alert('Copied to clipboard!');
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory); // เปลี่ยนสถานะการแสดงผล
  };

  return (
    <div className="flex min-h-screen bg-gray-100 p-10">
      <div className="w-1/2 pr-8 flex flex-col space-y-6">
        <h1 className="text-4xl font-bold text-blue-700 text-center">Short URL Generator</h1>
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Form สำหรับกรอก URL และปุ่มการสร้าง Short URL */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-full space-y-4">
          <input 
            type="url" 
            placeholder="Enter URL here..." 
            className="w-full p-3 border rounded-lg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Short URL'}
          </button>
        </form>

        {/* ปุ่ม "View History" */}
        <div className="text-center">
          <button 
            onClick={toggleHistory}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {showHistory ? 'Hide History' : 'View URL History'}
          </button>
        </div>

        {/* แสดงผลเมื่อได้ Short URL */}
        {shortUrl && !showHistory && (
          <div className="bg-white p-6 rounded-lg shadow-lg text-center space-y-4">
            <p className="text-lg font-semibold">Your Short URL:</p>
            <div className="flex justify-center items-center space-x-2">
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                {shortUrl}
              </a>
              <button onClick={copyToClipboard} className="bg-gray-300 px-2 py-1 rounded">Copy</button>
            </div>
            <img src={qrCode} alt="QR Code" className="mx-auto w-40" />
          </div>
        )}

        {/* แสดงประวัติ URL เมื่อกดปุ่ม "View History" */}
        {showHistory && (
          <div className="w-full bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">URL History</h2>
            {history.length === 0 ? (
              <p className="text-center text-gray-500">No history available</p>
            ) : (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
