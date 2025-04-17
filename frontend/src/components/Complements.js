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
                // Actualizar cantidad y total si el complemento ya existe
                return prev.map(c =>
                    c.id === complement.id
                        ? { ...c, quantity: c.quantity + complementQuantity, total: (c.quantity + complementQuantity) * c.price }
                        : c
                );
            } else {
                // Agregar nuevo complemento si no existe
                return [...prev, { ...complement, quantity: complementQuantity, total: complement.price * complementQuantity }];
            }
        });

        setSelectedComplement('');
        setComplementQuantity(1);
    };

    const handleRemoveComplement = (id) => {
        setSelectedComplements(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div>
            <h3>Complementos</h3>
            <div className="form-group">
                <label>Tipo:</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option value="">Seleccionar tipo</option>
                    {complementTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Complemento:</label>
                <select value={selectedComplement} onChange={(e) => setSelectedComplement(e.target.value)}>
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
            <button type="button" onClick={handleAddComplement}>Agregar complemento</button>
            <h3>Complementos Seleccionados</h3>
            <ul>
                {selectedComplements.map(complement => (
                    <li key={complement.id}>
                        {complement.name} - {complement.quantity} x ${complement.price} = ${complement.total}
                        <button type="button" onClick={() => handleRemoveComplement(complement.id)}>Eliminar</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Complements;
