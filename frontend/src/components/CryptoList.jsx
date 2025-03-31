function CryptoList({
    selectedCryptos,
    setSelectedCryptos,
    selectedCrypto,
    setSelectedCrypto,
}) {
    const handleDelete = (crypto) => {
        console.log('Deleting crypto:', crypto);
        const updatedCryptos = selectedCryptos.filter((c) => c.id !== crypto.id);
        setSelectedCryptos(updatedCryptos);
        if (selectedCrypto.id === crypto.id) {
            setSelectedCrypto(updatedCryptos[0] || { id: '', name: '' });
        }
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
                                className={`flex justify-between items-center cursor-pointer ${selectedCrypto.id === crypto.id ? 'bg-base-300' : ''
                                    }`}
                                onClick={() => handleSelect(crypto)}
                            >
                                <span>
                                    {crypto.name} ({crypto.symbol})
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