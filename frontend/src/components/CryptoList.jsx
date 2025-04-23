import React, { useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';

function CryptoList({
    selectedCryptos,
    setSelectedCryptos,
    selectedCrypto,
    setSelectedCrypto,
}) {
    useEffect(() => {
        axios
            .get('http://localhost:8002/api/watchlist')
            .then((response) => {
                setSelectedCryptos(response.data || []);
            })
            .catch((error) => {
                setSelectedCryptos([]);
            });
    }, [setSelectedCryptos]);

    const handleDelete = (crypto, e) => {
        e.stopPropagation();
        axios
            .delete(`http://localhost:8002/api/watchlist/${crypto.id}`)
            .then((response) => {
                setSelectedCryptos(response.data);
                if (selectedCrypto.id === crypto.id) {
                    setSelectedCrypto(response.data[0] || { id: '', name: '' });
                }
            })
            .catch((error) => {
                console.error('Error deleting crypto:', error);
            });
    };

    const handleSelect = (crypto) => {
        setSelectedCrypto(crypto);
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        try {
            const reorderedCryptos = Array.from(selectedCryptos);
            const [movedCrypto] = reorderedCryptos.splice(result.source.index, 1);
            reorderedCryptos.splice(result.destination.index, 0, movedCrypto);
            setSelectedCryptos(reorderedCryptos);
            axios
                .put('http://localhost:8002/api/watchlist', reorderedCryptos)
                .then((response) => {
                    console.log('Watchlist reordered:', response.data);
                })
                .catch((error) => {
                    console.error('Error reordering watchlist:', error);
                });
        } catch (error) {
            console.error('Error dragging:', error);
        }
    };

    const formatPrice = (price) => {
        if (price === null || price === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
        }).format(price);
    };

    return (
        <div className="watchlist">
            {selectedCryptos.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="watchlist">
                        {(provided) => (
                            <ul
                                className="menu bg-base-200 rounded-box h-[calc(100vh-18rem)] overflow-y-auto w-100"
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {selectedCryptos.map((crypto, index) => (
                                    <Draggable key={crypto.id} draggableId={crypto.id} index={index}>
                                        {(provided) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`flex justify-between  ${selectedCrypto.id === crypto.id ? 'bg-primary-300' : ''
                                                    }`}
                                                onClick={() => handleSelect(crypto)}
                                            >
                                                <div className="flex flex-p-2">
                                                    <div className='flex-none'>
                                                        <TrashIcon
                                                            className="h-4 w-4 text-gray-400 hover:text-warning cursor-pointer"
                                                            onClick={(e) => handleDelete(crypto, e)}
                                                        />
                                                    </div>
                                                    <div className="font-semibold">{crypto.symbol.toUpperCase()}</div>
                                                    <div className="flex-auto text-right text-gray-500 mx-2">{formatPrice(crypto.price)}</div>

                                                    <div className='flex-none' {...provided.dragHandleProps}>
                                                        <Bars3Icon className="h-5 w-5 text-gray-500 cursor-move" />
                                                    </div>

                                                </div>
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>
            ) : (
                <p className="text-gray-500">Add a cryptocurrency to your watchlist.</p>
            )}
        </div>
    );
}

export default CryptoList;