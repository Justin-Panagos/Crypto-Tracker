import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [coins, setCoins] = useState([]);
    const [filteredCoins, setFilteredCoins] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        axios.get('http://localhost:8002/api/coins')
            .then(response => {
                console.log('Coins response:', response.data);
                const mappedCoins = (response.data.data || []).map(coin => ({
                    id: coin.id || 'unknown',
                    name: coin.name || 'Unknown',
                    symbol: coin.symbol || 'N/A',
                    price: coin.price || 0.0
                }));
                setCoins(mappedCoins);
            })
            .catch(error => {
                console.error('Error fetching coins:', error);
                setCoins([]);
            });
    }, []);

    useEffect(() => {
        if (query) {
            axios.get(`http://localhost:8002/api/search/${encodeURIComponent(query)}`)
                .then(response => {
                    console.log('Search response:', response.data);
                    const mappedCoins = (response.data.data || []).map(coin => ({
                        id: coin.id || 'unknown',
                        name: coin.name || 'Unknown',
                        symbol: coin.symbol || 'N/A',
                        price: coin.price || 0.0
                    }));
                    setFilteredCoins(mappedCoins);
                })
                .catch(error => {
                    console.error('Error searching coins:', error);
                    setFilteredCoins([]);
                });
        } else {
            setFilteredCoins([]);
        }
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddToWatchlist = (coin) => {
        console.log('Adding to watchlist:', coin);
        axios.post('http://localhost:8002/api/watchlist', {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol
        })
            .then(response => console.log('Added to watchlist:', response.data))
            .catch(error => console.error('Error adding to watchlist:', error));
    };

    return (
        <div className="search-bar-container" ref={dropdownRef}>
            <input
                type="text"
                placeholder="Search for a cryptocurrency..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className="search-input"
            />
            {isDropdownOpen && (
                <div className="dropdown">
                    {(query ? filteredCoins : coins.slice(0, 10)).map((coin, index) => {
                        const isExactMatch = query.toLowerCase() === coin.name.toLowerCase() || query.toLowerCase() === coin.symbol.toLowerCase();
                        console.log(`Coin: ${coin.name}, isExactMatch: ${isExactMatch}, Price: ${coin.price}`);
                        return (
                            <div
                                key={coin.id}
                                className={`dropdown-item ${isExactMatch ? 'exact-match' : ''}`}
                            >
                                <span>
                                    {coin.symbol ? coin.symbol.toUpperCase() : 'N/A'}  - {coin.name}
                                </span>
                                <button onClick={() => handleAddToWatchlist(coin)}>Add</button>
                            </div>
                        );
                    })}
                    {query && filteredCoins.length === 0 && (
                        <div className="dropdown-item">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;