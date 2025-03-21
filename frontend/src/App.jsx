import { useState } from 'react';
import SearchBar from './components/SearchBar';
import CryptoList from './components/CryptoList';
import CandlestickChart from './components/CandlestickChart';

function App() {
  const [selectedCryptos, setSelectedCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState({ id: '', name: '' });

  const addCrypto = (crypto) => {
    if (selectedCryptos.length >= 6) {
      alert('Watchlist is limited to 6 cryptocurrencies.');
      return;
    }
    if (!selectedCryptos.some((c) => c.id === crypto.id)) {
      setSelectedCryptos([...selectedCryptos, crypto]);
      if (!selectedCrypto.id) {
        setSelectedCrypto(crypto);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-base-200 p-4">
        <h1 className="text-2xl font-bold">Crypto Tracker</h1>
      </header>
      <main className="flex flex-1">
        <div className="flex flex-col w-full">
          <SearchBar onAddCrypto={addCrypto} />
          <div className="flex flex-1">
            <CryptoList
              selectedCryptos={selectedCryptos}
              setSelectedCryptos={setSelectedCryptos}
              selectedCrypto={selectedCrypto}
              setSelectedCrypto={setSelectedCrypto}
            />
            <CandlestickChart crypto={selectedCrypto} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;