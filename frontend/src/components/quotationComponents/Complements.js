import React, { useState } from 'react';

const Complements = ({ complementTypes, complements, selectedComplements, setSelectedComplements }) => {
    const [selectedType, setSelectedType] = useState('');
    const [selectedComplement, setSelectedComplement] = useState('');
    const [complementQuantity, setComplementQuantity] = useState(1);

    const handleAddComplement = () => {
        if (!selectedComplement || complementQuantity <= 0) {
            console.error('Complemento o cantidad inválidos');
            return;
        }

        const complement = complements.find(c => c.id === parseInt(selectedComplement));
        if (!complement) {
            console.error('Complemento no encontrado');
            return;
        }

        setSelectedComplements(prev => {
            const existingComplement = prev.find(c => c.id === complement.id);
            if (existingComplement) {
                // Si ya existe, actualizar la cantidad
                return prev.map(c =>
                    c.id === complement.id
                        ? { ...c, quantity: c.quantity + complementQuantity }
                        : c
                );
            } else {
                // Si no existe, agregar un nuevo complemento
                return [...prev, { ...complement, quantity: complementQuantity }];
            }
        });

        // Reiniciar los campos de selección
        setSelectedComplement('');
        setComplementQuantity(1);
    };

    const handleRemoveComplement = (id) => {
        setSelectedComplements(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="complements-container">
            <h3>Complementos</h3>
            <div className="form-group">
                <label>Tipo de Complemento:</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option value="">Seleccionar tipo</option>
                    {complementTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Complemento:</label>
                <select
                    value={selectedComplement}
                    onChange={(e) => setSelectedComplement(e.target.value)}
                >
                    <option value="">Seleccionar complemento</option>
                    {complements
                        .filter(complement => complement.type_id === parseInt(selectedType))
                        .map(complement => (
                            <option key={complement.id} value={complement.id}>
                                {complement.name} - ${complement.price}
                            </option>
                        ))}
                </select>
            </div>
            <div className="form-group">
                <label>Cantidad:</label>
                <input
                    type="number"
                    value={complementQuantity}
                    onChange={(e) => setComplementQuantity(parseInt(e.target.value))}
                    min="1"
                />
            </div>
            <button type="button" onClick={handleAddComplement}>
                Agregar Complemento
            </button>
            <div className="form-group">
                <h3>Complementos Seleccionados</h3>
                <ul className="complements-list">
                    {selectedComplements.map(complement => (
                        <li key={complement.id} className="complement-item">
                            {complement.name} - {complement.quantity} x ${complement.price} = ${complement.quantity * complement.price}
                            <button
                                type="button"
                                className="remove-complement-button"
                                onClick={() => handleRemoveComplement(complement.id)}
                            >
                                X
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Complements;
