import React, { useEffect, useMemo } from 'react';
import { safeArray } from '../../utils/safeArray';

const OpeningType = ({
    openingForm,
    setOpeningForm,
    openingTypes,
    treatments,
    glassTypes,
    selectedOpenings,
    setSelectedOpenings,
    errors = {},
    openingConfigurations = []
}) => {
    useEffect(() => {
        console.log("openingConfigurations:", safeArray(openingConfigurations));
    }, [openingConfigurations]);

    // Convierte cm a mm para la búsqueda de sugerencia y cálculos
    const widthMm = openingForm.widthCm ? Number(openingForm.widthCm) * 10 : undefined;
    const heightMm = openingForm.heightCm ? Number(openingForm.heightCm) * 10 : undefined;

    // Buscar configuración sugerida según tipo, ancho y alto (en mm)
    const suggestedConfig = useMemo(() => {
        const configs = safeArray(openingConfigurations);
        if (!openingForm.typeId || !widthMm || !heightMm) return null;
        return configs.find(cfg =>
            Number(openingForm.typeId) === Number(cfg.opening_type_id) &&
            widthMm >= cfg.min_width_mm &&
            widthMm <= cfg.max_width_mm &&
            heightMm >= cfg.min_height_mm &&
            heightMm <= cfg.max_height_mm
        );
    }, [openingForm.typeId, widthMm, heightMm, openingConfigurations]);

    // Paneles sugeridos
    const suggestedPanels = {
        numPanelsWidth: suggestedConfig?.num_panels_width || 1,
        numPanelsHeight: suggestedConfig?.num_panels_height || 1,
        anchoPanel: suggestedConfig ? (widthMm / suggestedConfig.num_panels_width) : '',
        altoPanel: suggestedConfig ? (heightMm / suggestedConfig.num_panels_height) : ''
    };

    // Inputs controlados para ancho/alto panel
    const panelWidth = openingForm.panelWidth !== undefined
        ? openingForm.panelWidth
        : suggestedPanels.anchoPanel || '';
    const panelHeight = openingForm.panelHeight !== undefined
        ? openingForm.panelHeight
        : suggestedPanels.altoPanel || '';

    // Advierte si el usuario cambió los valores sugeridos
    const panelDiffers =
        panelWidth !== '' && panelHeight !== '' &&
        (Number(panelWidth) !== Number(suggestedPanels.anchoPanel) ||
         Number(panelHeight) !== Number(suggestedPanels.altoPanel));

    const handleAddOpening = () => {
        const { typeId, quantity, treatmentId, glassTypeId } = openingForm;
        // Convierte cm a mm antes de guardar
        const width = widthMm;
        const height = heightMm;
        // Validar que todos los campos estén completos
        if (!typeId || !width || !height || quantity <= 0 || !treatmentId || !glassTypeId) {
            console.error('Todos los campos son obligatorios');
            return;
        }
        // Verificar si ya existe una abertura con las mismas características
        const existingOpening = selectedOpenings.find(
            (opening) =>
                opening.typeId === typeId &&
                opening.width === width &&
                opening.height === height &&
                opening.treatmentId === treatmentId &&
                opening.glassTypeId === glassTypeId &&
                Number(opening.panelWidth) === Number(panelWidth) &&
                Number(opening.panelHeight) === Number(panelHeight)
        );
        if (existingOpening) {
            setSelectedOpenings((prev) =>
                prev.map((opening) =>
                    opening.id === existingOpening.id
                        ? { ...opening, quantity: opening.quantity + parseInt(quantity) }
                        : opening
                )
            );
        } else {
            setSelectedOpenings((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    typeId,
                    typeName: openingTypes.find((type) => type.id === parseInt(typeId))?.name,
                    width,
                    height,
                    quantity: parseInt(quantity),
                    treatmentId,
                    treatmentName: treatments.find((t) => t.id === parseInt(treatmentId))?.name,
                    glassTypeId,
                    glassTypeName: glassTypes.find((g) => g.id === parseInt(glassTypeId))?.name,
                    numPanelsWidth: suggestedConfig?.num_panels_width,
                    numPanelsHeight: suggestedConfig?.num_panels_height,
                    panelWidth: Number(panelWidth),
                    panelHeight: Number(panelHeight)
                },
            ]);
        }
        setOpeningForm({ typeId: '', widthCm: '', heightCm: '', quantity: 1, treatmentId: '', glassTypeId: '', panelWidth: undefined, panelHeight: undefined });
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
                    value={openingForm.typeId || ''}
                    onChange={e => handleInputChange("typeId", e.target.value)}
                    className={errors.typeId ? "input-error" : ""}
                >
                    <option value="">Seleccione tipo</option>
                    {safeArray(openingTypes).map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
                {errors.typeId && <span className="error-message">{errors.typeId}</span>}
            </div>
            <div className="form-group">
                <label>
                    Ancho (cm) <span style={{ color: "#888", fontSize: 13 }}>(mín. 50cm, máx. 1000cm)</span>
                </label>
                <input
                    type="number"
                    value={openingForm.widthCm || ''}
                    onChange={e => handleInputChange("widthCm", e.target.value)}
                    className={errors.width ? "input-error" : ""}
                    placeholder="Ancho en centímetros"
                    min={50}
                    max={1000}
                />
                {errors.width && <span className="error-message">{errors.width}</span>}
            </div>
            <div className="form-group">
                <label>
                    Alto (cm) <span style={{ color: "#888", fontSize: 13 }}>(mín. 50cm, máx. 1000cm)</span>
                </label>
                <input
                    type="number"
                    value={openingForm.heightCm || ''}
                    onChange={e => handleInputChange("heightCm", e.target.value)}
                    className={errors.height ? "input-error" : ""}
                    placeholder="Alto en centímetros"
                    min={50}
                    max={1000}
                />
                {errors.height && <span className="error-message">{errors.height}</span>}
            </div>
            {suggestedConfig && (
                <div className="panel-suggestion" style={{ marginTop: 12, color: "#26b7cd" }}>
                    <strong>Sugerencia:</strong> {suggestedConfig.num_panels_width} panel(es) de ancho x {suggestedConfig.num_panels_height} panel(es) de alto
                </div>
            )}
            <div className="form-group">
                <label>Ancho de panel (mm)</label>
                <input
                    type="number"
                    value={panelWidth}
                    onChange={e => handleInputChange("panelWidth", e.target.value)}
                    placeholder="Ancho de panel"
                />
            </div>
            <div className="form-group">
                <label>Alto de panel (mm)</label>
                <input
                    type="number"
                    value={panelHeight}
                    onChange={e => handleInputChange("panelHeight", e.target.value)}
                    placeholder="Alto de panel"
                />
            </div>
            {panelDiffers && (
                <div style={{ color: "#e67e22", marginBottom: 8 }}>
                    <b>Advertencia:</b> Se recomienda usar los valores sugeridos ({suggestedPanels.anchoPanel} x {suggestedPanels.altoPanel} mm), pero puede modificarlos si lo desea.
                </div>
            )}
            <div className="form-group">
                <label>Cantidad</label>
                <input
                    type="number"
                    value={openingForm.quantity || 1}
                    onChange={e => handleInputChange("quantity", e.target.value)}
                    className={errors.quantity ? "input-error" : ""}
                    placeholder="Cantidad"
                />
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
            </div>
            <div className="form-group">
                <label>Tratamiento</label>
                <select
                    value={openingForm.treatmentId || ''}
                    onChange={e => handleInputChange("treatmentId", e.target.value)}
                    className={errors.treatmentId ? "input-error" : ""}
                >
                    <option value="">Seleccione tratamiento</option>
                    {safeArray(treatments).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                {errors.treatmentId && <span className="error-message">{errors.treatmentId}</span>}
            </div>
            <div className="form-group">
                <label>Tipo de vidrio</label>
                <select
                    value={openingForm.glassTypeId || ''}
                    onChange={e => handleInputChange("glassTypeId", e.target.value)}
                    className={errors.glassTypeId ? "input-error" : ""}
                >
                    <option value="">Seleccione tipo de vidrio</option>
                    {safeArray(glassTypes).map(g => (
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
