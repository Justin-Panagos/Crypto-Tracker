import { useState } from 'react';
import axios from 'axios';

export default function SearchBar({ onAddCrypto }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        setQuery(e.target.value);
        if (e.target.value.length > 2) {
            const response = await axios.get(`/api/search/${e.target.value}`);
            setResults(response.data);
        } else {
            setResults([]);
        }
    };

    const handleSelect = (crypto) => {
        onAddCrypto(crypto);
        setQuery('');
        setResults([]);
    };

    return (
        <div className="w-full p-4">
            <input
                type="text"
                placeholder="Search for a cryptocurrency..."
                className="input input-bordered w-full"
                value={query}
                onChange={handleSearch}
            />
            {results.length > 0 && (
                <ul className="menu bg-base-100 w-full rounded-box mt-2">
                    {results.map((crypto) => (
                        <li key={crypto.id}>
                            <a onClick={() => handleSelect(crypto)}>
                                {crypto.name} ({crypto.symbol.toUpperCase()})
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}