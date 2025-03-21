import { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import axios from 'axios';

function SortableCrypto({ crypto, onSelect, isSelected }) {
    const { attributes, listeners, setNodeRef, transform } = useSortable({ id: crypto.id });
    const [data, setData] = useState({ current_price: 0, sma_3min: 0, fib_averages: {} });

    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get(`/api/crypto/${crypto.id}`);
            setData(response.data);
        };
        fetchData();
        const interval = setInterval(fetchData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [crypto.id]);

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex flex-col p-2 mb-2 rounded cursor-pointer ${isSelected ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'
                }`}
            onClick={() => onSelect(crypto)}
        >
            <div className="flex justify-between">
                <span>{crypto.name} ({crypto.symbol.toUpperCase()})</span>
                <span>${data.current_price.toFixed(2)}</span>
            </div>
            <div className="text-sm">
                <p>3-min SMA: ${data.sma_3min.toFixed(2)}</p>
                {Object.entries(data.fib_averages).map(([key, value]) => (
                    <p key={key}>{key}: ${value.toFixed(2)}</p>
                ))}
            </div>
        </li>
    );
}

export default function CryptoList({ selectedCryptos, setSelectedCryptos, selectedCrypto, setSelectedCrypto }) {
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = selectedCryptos.findIndex((crypto) => crypto.id === active.id);
            const newIndex = selectedCryptos.findIndex((crypto) => crypto.id === over.id);
            const newOrder = arrayMove(selectedCryptos, oldIndex, newIndex);
            setSelectedCryptos(newOrder);
            if (selectedCrypto.id === active.id) {
                setSelectedCrypto(newOrder[newIndex]);
            }
        }
    };

    return (
        <div className="w-1/4 p-4 overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Watchlist</h2>
            {selectedCryptos.length === 0 ? (
                <p className="text-gray-400">Add cryptocurrencies to your watchlist.</p>
            ) : (
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={selectedCryptos} strategy={verticalListSortingStrategy}>
                        <ul className="list-none p-0">
                            {selectedCryptos.map((crypto) => (
                                <SortableCrypto
                                    key={crypto.id}
                                    crypto={crypto}
                                    onSelect={setSelectedCrypto}
                                    isSelected={selectedCrypto.id === crypto.id}
                                />
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}