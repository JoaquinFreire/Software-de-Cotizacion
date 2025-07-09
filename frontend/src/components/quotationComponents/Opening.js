import React from 'react';

const OpeningType = ({
    openingForm,
    setOpeningForm,
    openingTypes,
    treatments,
    glassTypes,
    selectedOpenings,
    setSelectedOpenings,
    errors = {}
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

    const handleInputChange = (field, value) => {
        setOpeningForm({ ...openingForm, [field]: value });
        if (errors[field]) {
            errors[field] = undefined;
        }
    };

    return (
        <div className="opening-container">
            <h3>Aberturas</h3>
            <div className="form-group">
                <label>Tipo de abertura</label>
                <select
                    value={openingForm.typeId}
                    onChange={e => handleInputChange("typeId", e.target.value)}
                    className={errors.typeId ? "input-error" : ""}
                >
                    <option value="">Seleccione tipo</option>
                    {openingTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
                {errors.typeId && <span className="error-message">{errors.typeId}</span>}
            </div>
            <div className="form-group">
                <label>Ancho</label>
                <input
                    type="number"
                    value={openingForm.width}
                    onChange={e => handleInputChange("width", e.target.value)}
                    className={errors.width ? "input-error" : ""}
                    placeholder="Ancho"
                />
                {errors.width && <span className="error-message">{errors.width}</span>}
            </div>
            <div className="form-group">
                <label>Alto</label>
                <input
                    type="number"
                    value={openingForm.height}
                    onChange={e => handleInputChange("height", e.target.value)}
                    className={errors.height ? "input-error" : ""}
                    placeholder="Alto"
                />
                {errors.height && <span className="error-message">{errors.height}</span>}
            </div>
            <div className="form-group">
                <label>Cantidad</label>
                <input
                    type="number"
                    value={openingForm.quantity}
                    onChange={e => handleInputChange("quantity", e.target.value)}
                    className={errors.quantity ? "input-error" : ""}
                    placeholder="Cantidad"
                />
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
            </div>
            <div className="form-group">
                <label>Tratamiento</label>
                <select
                    value={openingForm.treatmentId}
                    onChange={e => handleInputChange("treatmentId", e.target.value)}
                    className={errors.treatmentId ? "input-error" : ""}
                >
                    <option value="">Seleccione tratamiento</option>
                    {treatments.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                {errors.treatmentId && <span className="error-message">{errors.treatmentId}</span>}
            </div>
            <div className="form-group">
                <label>Tipo de vidrio</label>
                <select
                    value={openingForm.glassTypeId}
                    onChange={e => handleInputChange("glassTypeId", e.target.value)}
                    className={errors.glassTypeId ? "input-error" : ""}
                >
                    <option value="">Seleccione tipo de vidrio</option>
                    {glassTypes.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
                {errors.glassTypeId && <span className="error-message">{errors.glassTypeId}</span>}
            </div>
            <button className="botton-carusel" type="button" onClick={handleAddOpening}>
                Agregar Abertura
            </button>
        </div>
    );
};

export default OpeningType;
