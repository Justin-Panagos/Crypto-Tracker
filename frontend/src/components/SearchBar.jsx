import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [coins, setCoins] = useState([]);
    const [filteredCoins, setFilteredCoins] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch all coins on mount
    useEffect(() => {
        axios.get('http://localhost:8002/api/coins')
            .then(response => setCoins(response.data))
            .catch(error => console.error('Error fetching coins:', error));
    }, []);

    // Filter coins when typing
    useEffect(() => {
        if (query) {
            axios.get(`http://localhost:8002/api/search/${query}`)
                .then(response => setFilteredCoins(response.data))
                .catch(error => console.error('Error searching coins:', error));
        } else {
            setFilteredCoins([]);
        }
    }, [query]);

    // Close dropdown when clicking outside
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
                    {(query ? filteredCoins : coins.slice(0, 10)).map(coin => (
                        <div key={coin.id} className="dropdown-item">
                            <span>{coin.name} ({coin.symbol.toUpperCase()})</span>
                            <button onClick={() => handleAddToWatchlist(coin)}>Add</button>
                        </div>
                    ))}
                    {query && filteredCoins.length === 0 && (
                        <div className="dropdown-item">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;