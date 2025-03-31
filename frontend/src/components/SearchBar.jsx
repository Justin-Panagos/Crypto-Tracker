import { useState } from 'react';
import axios from 'axios';

function SearchBar({ onAddCrypto }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (query.trim() === '') return;
        try {
            const response = await axios.get(`/api/search/${query}`);
            setResults(response.data);
        } catch (error) {
            console.error('Error fetching search results:', error);
            setResults([]);
        }
    };

    return (
        <div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a cryptocurrency..."
                    className="input input-bordered flex-1"
                />
                <button type="submit" className="btn btn-primary">
                    Search
                </button>
            </form>
            {results.length > 0 && (
                <ul className="menu bg-base-200 rounded-box max-h-64 overflow-y-auto">
                    {results.map((coin) => (
                        <li key={coin.id}>
                            <div className="flex justify-between items-center">
                                <span>
                                    {coin.name} ({coin.symbol})
                                </span>
                                <button
                                    onClick={() => {
                                        console.log('Adding coin:', coin);
                                        onAddCrypto(coin);
                                    }}
                                    className="btn btn-sm btn-outline btn-success"
                                >
                                    Add
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchBar;