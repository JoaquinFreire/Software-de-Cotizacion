import React from 'react';

const OpeningType = ({
    openingForm,
    setOpeningForm,
    openingTypes,
    treatments,
    glassTypes,
    selectedOpenings,
    setSelectedOpenings,
}) => {
    const handleAddOpening = () => {
        const { typeId, width, height, quantity, treatmentId, glassTypeId } = openingForm;

        // Validar que todos los campos estén completos
        if (!typeId || !width || !height || quantity <= 0 || !treatmentId || !glassTypeId) {
            console.log(typeId, " ", width, " ", height, " ", quantity, " ", treatmentId, " ", glassTypeId);
            console.error('Todos los campos son obligatorios');
            return;
        }

        // Verificar si ya existe una abertura con las mismas características
        const existingOpening = selectedOpenings.find(
            (opening) =>
                opening.typeId === typeId &&
                opening.width === parseFloat(width) &&
                opening.height === parseFloat(height) &&
                opening.treatmentId === treatmentId &&
                opening.glassTypeId === glassTypeId
        );

        if (existingOpening) {
            // Si ya existe, actualizar la cantidad
            setSelectedOpenings((prev) =>
                prev.map((opening) =>
                    opening.id === existingOpening.id
                        ? { ...opening, quantity: opening.quantity + parseInt(quantity) }
                        : opening
                )
            );
        } else {
            // Si no existe, agregar una nueva abertura
            setSelectedOpenings((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    typeId,
                    typeName: openingTypes.find((type) => type.id === parseInt(typeId)).name,
                    width: parseFloat(width),
                    height: parseFloat(height),
                    quantity: parseInt(quantity),
                    treatmentId,
                    treatmentName: treatments.find((t) => t.id === parseInt(treatmentId)).name,
                    glassTypeId,
                    glassTypeName: glassTypes.find((g) => g.id === parseInt(glassTypeId)).name,
                },
            ]);
        }

        // Reiniciar el formulario
        setOpeningForm({ typeId: '', width: '', height: '', quantity: 1, treatmentId: '', glassTypeId: '' });
    };

    const handleRemoveOpening = (id) => {
        setSelectedOpenings((prev) => prev.filter((opening) => opening.id !== id));
    };

    return (
        <div className="opening-container">
            <h3>Aberturas</h3>
            <div className="form-group">
                <label>Tipo de Abertura:</label>
                <select
                    value={openingForm.typeId}
                    onChange={(e) => setOpeningForm({ ...openingForm, typeId: e.target.value })}
                >
                    <option value="">Seleccionar tipo de abertura</option>
                    {openingTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                            {type.name}
                        </option>
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
                    {treatments.map((treatment) => (
                        <option key={treatment.id} value={treatment.id}>
                            {treatment.name}
                        </option>
                    ))}
                </select>
                <label>Tipo de Vidrio:</label>
                <select
                    value={openingForm.glassTypeId}
                    onChange={(e) => setOpeningForm({ ...openingForm, glassTypeId: e.target.value })}
                >
                    <option value="">Seleccionar tipo de vidrio</option>
                    {glassTypes.map((glass) => (
                        <option key={glass.id} value={glass.id}>
                            {glass.name}
                        </option>
                    ))}
                </select>
                <button className="botton-carusel" type="button" onClick={handleAddOpening}>
                    Agregar Abertura
                </button>
            </div>
            <div className="form-group">
                <h3>Aberturas Seleccionadas</h3>
                <ul className="opening-list">
                    {selectedOpenings.map((opening) => (
                        <li key={opening.id} className="opening-item">
                            {opening.typeName} - {opening.width}m x {opening.height}m - {opening.quantity} unidades
                            - Tratamiento: {opening.treatmentName} - Vidrio: {opening.glassTypeName}
                            <button
                                type="button"
                                className="remove-opening-button"
                                onClick={() => handleRemoveOpening(opening.id)}
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

export default OpeningType;
