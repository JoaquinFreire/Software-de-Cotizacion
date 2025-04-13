import React from 'react';

const OpeningType = ({ openingForm, setOpeningForm, openingTypes, treatments, glassTypes, selectedOpenings, handleAddOpening, handleRemoveOpening }) => {
    return (
        <div>
            <div className="form-group">
                <h3>Tipos de Abertura</h3>
                <label>Tipo de Abertura:</label>
                <select
                    value={openingForm.typeId}
                    onChange={(e) => setOpeningForm({ ...openingForm, typeId: e.target.value })}
                >
                    <option value="">Seleccionar tipo de abertura</option>
                    {openingTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
                <label>Ancho (m):</label>
                <input
                    type="number"
                    value={openingForm.width}
                    onChange={(e) => setOpeningForm({ ...openingForm, width: e.target.value })}
                    min="0"
                    step="0.01"
                />
                <label>Alto (m):</label>
                <input
                    type="number"
                    value={openingForm.height}
                    onChange={(e) => setOpeningForm({ ...openingForm, height: e.target.value })}
                    min="0"
                    step="0.01"
                />
                <label>Cantidad:</label>
                <input
                    type="number"
                    value={openingForm.quantity}
                    onChange={(e) => setOpeningForm({ ...openingForm, quantity: e.target.value })}
                    min="1"
                />
                <label>Tratamiento:</label>
                <select
                    value={openingForm.treatmentId}
                    onChange={(e) => setOpeningForm({ ...openingForm, treatmentId: e.target.value })}
                >
                    <option value="">Seleccionar tratamiento</option>
                    {treatments.map(treatment => (
                        <option key={treatment.id} value={treatment.id}>{treatment.name}</option>
                    ))}
                </select>
                <label>Tipo de Vidrio:</label>
                <select
                    value={openingForm.glassTypeId}
                    onChange={(e) => setOpeningForm({ ...openingForm, glassTypeId: e.target.value })}
                >
                    <option value="">Seleccionar tipo de vidrio</option>
                    {glassTypes.map(glass => (
                        <option key={glass.id} value={glass.id}>{glass.name}</option>
                    ))}
                </select>
                <button type="button" onClick={handleAddOpening}>Agregar Abertura</button>
            </div>
            <div className="form-group">
                <h3>Aberturas Seleccionadas</h3>
                <ul>
                    {selectedOpenings.map(opening => (
                        <li key={opening.id}>
                            {opening.typeName} - {opening.width}m x {opening.height}m - {opening.quantity} unidades
                            - Tratamiento: {opening.treatmentName} - Vidrio: {opening.glassTypeName}
                            <button type="button" onClick={() => handleRemoveOpening(opening.id)}>Eliminar</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default OpeningType;
