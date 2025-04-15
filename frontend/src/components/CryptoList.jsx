import React, { useEffect } from 'react';
import axios from 'axios';

function CryptoList({
    selectedCryptos,
    setSelectedCryptos,
    selectedCrypto,
    setSelectedCrypto,
}) {
    useEffect(() => {
        axios.get('http://localhost:8002/api/watchlist')
            .then(response => {
                console.log('Watchlist response:', response.data);
                setSelectedCryptos(response.data || []);
            })
            .catch(error => {
                console.error('Error fetching watchlist:', error);
                setSelectedCryptos([]);
            });
    }, [setSelectedCryptos]);

    const handleDelete = (crypto) => {
        console.log('Deleting crypto:', crypto);
        axios.delete(`http://localhost:8002/api/watchlist/${crypto.id}`)
            .then(response => {
                console.log('Watchlist after delete:', response.data);
                setSelectedCryptos(response.data);
                if (selectedCrypto.id === crypto.id) {
                    setSelectedCrypto(response.data[0] || { id: '', name: '' });
                }
            })
            .catch(error => {
                console.error('Error deleting crypto:', error);
            });
    };

    const handleSelect = (crypto) => {
        console.log('Selecting crypto:', crypto);
        setSelectedCrypto(crypto);
    };

    return (
        <div>
            {selectedCryptos.length > 0 ? (
                <ul className="menu bg-base-200 rounded-box h-[calc(100vh-18rem)] overflow-y-auto">
                    {selectedCryptos.map((crypto) => (
                        <li key={crypto.id}>
                            <div
                                className={`flex justify-between items-center cursor-pointer ${selectedCrypto.id === crypto.id ? 'bg-base-300' : ''}`}
                                onClick={() => handleSelect(crypto)}
                            >
                                <span>
                                    {crypto.name} ({crypto.symbol.toUpperCase()})
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(crypto);
                                    }}
                                    className="btn btn-sm btn-error"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">Add a cryptocurrency to your watchlist.</p>
            )}
        </div>
    );
}

export default CryptoList;