import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ setSelectedCryptos }) => {
    const [query, setQuery] = useState('');
    const [coins, setCoins] = useState([]);
    const [filteredCoins, setFilteredCoins] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        axios.get('http://localhost:8002/api/coins')
            .then(response => {
                const mappedCoins = (response.data.data || []).map(coin => ({
                    id: String(coin.id || 'unknown'),
                    name: coin.name || 'Unknown',
                    symbol: coin.symbol || 'N/A'
                }));
                setCoins(mappedCoins);
            })
            .catch(error => {
                setCoins([]);
            });
    }, []);

    useEffect(() => {
        if (query.trim()) {
            axios.get(`http://localhost:8002/api/search/${encodeURIComponent(query.trim())}`)
                .then(response => {
                    const mappedCoins = (response.data.data || []).map(coin => ({
                        id: String(coin.id || 'unknown'),
                        name: coin.name || 'Unknown',
                        symbol: coin.symbol || 'N/A'
                    }));
                    setFilteredCoins(mappedCoins);
                })
                .catch(error => {
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
                setQuery('');
                setFilteredCoins([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddToWatchlist = (coin) => {
        const payload = {
            id: String(coin.id || 'unknown'),
            name: coin.name || 'Unknown',
            symbol: coin.symbol || 'N/A'
        };
        axios.post('http://localhost:8002/api/watchlist', payload)
            .then(response => {
                setSelectedCryptos(response.data);
                setIsDropdownOpen(false);
                setQuery("")
                setFilteredCoins([]);
            })
            .catch(error => {
                console.error('Error adding to watchlist:', error.response?.data || error.message);
            });
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
                <div className="dropdown bg-base-100">
                    {(query.trim() ? filteredCoins : coins.slice(0, 10)).map((coin, index) => {
                        const isExactMatch = query.toLowerCase().trim().split(/\s+/).some(word =>
                            word === coin.name.toLowerCase().trim() || word === coin.symbol.toLowerCase().trim()
                        );
                        return (
                            <div
                                key={coin.id}
                                className={`dropdown-item ${isExactMatch ? 'exact-match' : ''} hover:bg-base-300`}
                            >
                                <span>
                                    {coin.name} ({coin.symbol ? coin.symbol.toUpperCase() : 'N/A'})
                                </span>
                                <button onClick={() => handleAddToWatchlist(coin)}><PlusCircleIcon className="h-5 w-5 hover:text-green-500" /></button>
                            </div>
                        );
                    })}
                    {query.trim() && filteredCoins.length === 0 && (
                        <div className="dropdown-item">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;