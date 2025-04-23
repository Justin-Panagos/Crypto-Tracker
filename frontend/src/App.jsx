import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar.jsx';
import CryptoList from './components/CryptoList.jsx';
import CryptoCharts from './components/CryptoCharts.jsx';
import './index.css';

function App() {
  const [selectedCryptos, setSelectedCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState({ id: '', name: '' });
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (selectedCryptos.length > 0 && !selectedCrypto.id) {
      setSelectedCrypto(selectedCryptos[0]);
    } else if (selectedCryptos.length === 0) {
      setSelectedCrypto({ id: '', name: '' });
    }
  }, [selectedCryptos, selectedCrypto.id]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-6xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Crypto Tracker</h1>
          <button onClick={toggleTheme} className="btn btn-sm">
            Toggle Theme ({theme === 'light' ? 'Dark' : 'Light'})
          </button>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Search Cryptocurrencies</h3>
          <SearchBar setSelectedCryptos={setSelectedCryptos} />
        </div>
        <div className="flex gap-4">
          <div className="w-[300px]">
            <h3 className="text-lg font-semibold mb-2">Watchlist</h3>
            <CryptoList
              selectedCryptos={selectedCryptos}
              setSelectedCryptos={setSelectedCryptos}
              selectedCrypto={selectedCrypto}
              setSelectedCrypto={setSelectedCrypto}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {selectedCrypto.name
                ? `${selectedCrypto.name} Chart`
                : 'Select a Crypto to View Chart'}
            </h3>
            <CryptoCharts crypto={selectedCrypto} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;