import React, { useEffect, useMemo, useState } from 'react';
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
    openingConfigurations = [],
    onLogOpening,
}) => {
    const [localErrors, setLocalErrors] = useState({});

    useEffect(() => {
        console.log("openingConfigurations:", safeArray(openingConfigurations));
    }, [openingConfigurations]);

    // Convierte cm a mm para la búsqueda de sugerencia y cálculos
    const widthCm = openingForm.widthCm ? Number(openingForm.widthCm) : undefined;
    const heightCm = openingForm.heightCm ? Number(openingForm.heightCm) : undefined;
    const widthMm = widthCm ? widthCm * 10 : undefined;
    const heightMm = heightCm ? heightCm * 10 : undefined;

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

    // Paneles sugeridos (por cantidad)
    const suggestedPanels = {
        numPanelsWidth: suggestedConfig?.num_panels_width || 1,
        numPanelsHeight: suggestedConfig?.num_panels_height || 1,
        anchoPanelMm: suggestedConfig && widthMm ? (widthMm / suggestedConfig.num_panels_width) : undefined,
        altoPanelMm: suggestedConfig && heightMm ? (heightMm / suggestedConfig.num_panels_height) : undefined,
        anchoPanelCm: suggestedConfig && widthCm ? (widthCm / suggestedConfig.num_panels_width) : undefined,
        altoPanelCm: suggestedConfig && heightCm ? (heightCm / suggestedConfig.num_panels_height) : undefined,
    };

    // Cantidad de paneles controlada
    const numPanelsWidth = openingForm.numPanelsWidth !== undefined && openingForm.numPanelsWidth !== ''
        ? Number(openingForm.numPanelsWidth)
        : suggestedPanels.numPanelsWidth;
    const numPanelsHeight = openingForm.numPanelsHeight !== undefined && openingForm.numPanelsHeight !== ''
        ? Number(openingForm.numPanelsHeight)
        : suggestedPanels.numPanelsHeight;

    // Calcular tamaño de panel en mm y cm según la cantidad de paneles seleccionada
    const anchoPanelMmComputed = (widthMm && numPanelsWidth) ? (widthMm / numPanelsWidth) : '';
    const altoPanelMmComputed = (heightMm && numPanelsHeight) ? (heightMm / numPanelsHeight) : '';
    const anchoPanelCmComputed = (widthCm && numPanelsWidth) ? (widthCm / numPanelsWidth) : '';
    const altoPanelCmComputed = (heightCm && numPanelsHeight) ? (heightCm / numPanelsHeight) : '';

    // Mostrar en cm para el usuario
    const anchoPanelCmDisplay = anchoPanelCmComputed ? (anchoPanelCmComputed).toFixed(1) : '';
    const altoPanelCmDisplay = altoPanelCmComputed ? (altoPanelCmComputed).toFixed(1) : '';

    // Advierte si el usuario cambió la cantidad de paneles sugerida
    const panelDiffers = (numPanelsWidth !== suggestedPanels.numPanelsWidth) || (numPanelsHeight !== suggestedPanels.numPanelsHeight);

    const handleAddOpening = () => {
        const { typeId, quantity, treatmentId, glassTypeId } = openingForm;
        // Guardar width/height en CENTÍMETROS (cm)
        const width = widthCm;
        const height = heightCm;
        const parsedQty = Number(quantity || 0);

        // Validar que todos los campos estén completos
        const newErrors = {};
        if (!typeId) newErrors.typeId = "Tipo requerido";
        if (!width || !Number.isFinite(Number(width)) || Number(width) <= 0) newErrors.width = "Ancho inválido";
        if (!height || !Number.isFinite(Number(height)) || Number(height) <= 0) newErrors.height = "Alto inválido";
        if (!parsedQty || parsedQty <= 0) newErrors.quantity = "Cantidad inválida";
        if (!treatmentId) newErrors.treatmentId = "Tratamiento requerido";
        if (!glassTypeId) newErrors.glassTypeId = "Tipo de vidrio requerido";

        if (Object.keys(newErrors).length > 0) {
            setLocalErrors(newErrors);
            return;
        }
        // Limpiar errores si todo OK
        setLocalErrors({});

        // Verificar si ya existe una abertura con las mismas características (se compara cantidad de paneles)
        const existingOpening = selectedOpenings.find(
            (opening) =>
                opening.typeId === typeId &&
                opening.width === width &&
                opening.height === height &&
                opening.treatmentId === treatmentId &&
                opening.glassTypeId === glassTypeId &&
                Number(opening.numPanelsWidth) === Number(numPanelsWidth) &&
                Number(opening.numPanelsHeight) === Number(numPanelsHeight)
        );

        const newOpening = {
            id: Date.now(),
            typeId,
            typeName: openingTypes.find((type) => type.id === parseInt(typeId))?.name,
            width, // ahora en cm
            height, // ahora en cm
            quantity: parseInt(quantity),
            treatmentId,
            treatmentName: treatments.find((t) => t.id === parseInt(treatmentId))?.name,
            glassTypeId,
            glassTypeName: glassTypes.find((g) => g.id === parseInt(glassTypeId))?.name,
            numPanelsWidth: numPanelsWidth,
            numPanelsHeight: numPanelsHeight,
            // guardamos tamaño de panel en cm calculado en función de la cantidad
            panelWidth: anchoPanelCmComputed || undefined,
            panelHeight: altoPanelCmComputed || undefined,
            mosquito: openingForm.mosquito ? true : false
        };
        if (existingOpening) {
            setSelectedOpenings((prev) =>
                prev.map((opening) =>
                    opening.id === existingOpening.id
                        ? { ...opening, quantity: opening.quantity + parseInt(quantity) }
                        : opening
                )
            );
            if (onLogOpening) onLogOpening(existingOpening);
        } else {
            setSelectedOpenings((prev) => [
                ...prev,
                newOpening,
            ]);
            if (onLogOpening) onLogOpening(newOpening);
        }
        setOpeningForm({ typeId: '', widthCm: '', heightCm: '', quantity: 1, treatmentId: '', glassTypeId: '', numPanelsWidth: undefined, numPanelsHeight: undefined, mosquito: false });
    };

    const handleInputChange = (field, value) => {
        setOpeningForm({ ...openingForm, [field]: value });
        // limpiar errores locales al modificar el campo
        setLocalErrors(prev => {
            if (!prev) return {};
            const copy = { ...prev };
            delete copy[field];
            return copy;
        });
        if (errors[field]) {
            errors[field] = undefined;
        }
    };

    // Cuando muestres sugerencias y campos de panel, usa cm en vez de mm
    const sugerencia = suggestedConfig
        ? `Sugerencia: ${suggestedConfig.num_panels_width} panel(es) de ancho x ${suggestedConfig.num_panels_height} panel(es) de alto.`
        : "";

    return (
        <div className="opening-container">
            <h3>Aberturas</h3>
            
            {/* Tipo de abertura */}
            <div className="form-group">
                <label>Tipo de abertura</label>
                <select
                    value={openingForm.typeId || ''}
                    onChange={e => handleInputChange("typeId", e.target.value)}
                    className={ (localErrors.typeId || errors.typeId) ? "input-error" : "" }
                >
                    <option value="">Seleccione tipo</option>
                    {safeArray(openingTypes).map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
                {(localErrors.typeId || errors.typeId) && <span className="error-message">{localErrors.typeId || errors.typeId}</span>}
            </div>

            {/* Ancho */}
            <div className="form-group">
                <label>
                    Ancho (cm) <span style={{ color: "#888", fontSize: 13 }}>(mín. 50cm, máx. 1000cm)</span>
                </label>
                <input
                    type="number"
                    value={openingForm.widthCm || ''}
                    onChange={e => handleInputChange("widthCm", e.target.value)}
                    className={ (localErrors.width || errors.width) ? "input-error" : "" }
                    placeholder="Ancho en centímetros"
                    min={50}
                    max={1000}
                />
                {(localErrors.width || errors.width) && <span className="error-message">{localErrors.width || errors.width}</span>}
            </div>

            {/* Alto */}
            <div className="form-group">
                <label>
                    Alto (cm) <span style={{ color: "#888", fontSize: 13 }}>(mín. 50cm, máx. 1000cm)</span>
                </label>
                <input
                    type="number"
                    value={openingForm.heightCm || ''}
                    onChange={e => handleInputChange("heightCm", e.target.value)}
                    className={ (localErrors.height || errors.height) ? "input-error" : "" }
                    placeholder="Alto en centímetros"
                    min={50}
                    max={1000}
                />
                {(localErrors.height || errors.height) && <span className="error-message">{localErrors.height || errors.height}</span>}
            </div>

            {sugerencia && (
                <div className="panel-suggestion" style={{ marginTop: 12, color: "#26b7cd" }}>
                    <strong>{sugerencia}</strong>
                </div>
            )}

            {/* Cantidad de paneles */}
            <div className="form-group">
                <label>Cantidad de paneles (ancho)</label>
                <input
                    type="number"
                    value={openingForm.numPanelsWidth !== undefined ? openingForm.numPanelsWidth : suggestedPanels.numPanelsWidth}
                    onChange={e => handleInputChange("numPanelsWidth", e.target.value.replace(/\D/g, ''))}
                    min={1}
                />
            </div>
            <div className="form-group">
                <label>Cantidad de paneles (alto)</label>
                <input
                    type="number"
                    value={openingForm.numPanelsHeight !== undefined ? openingForm.numPanelsHeight : suggestedPanels.numPanelsHeight}
                    onChange={e => handleInputChange("numPanelsHeight", e.target.value.replace(/\D/g, ''))}
                    min={1}
                />
            </div>

            {/* Tamaño de panel calculado */}
            <div className="form-group">
                <label>Tamaño de panel (cm) — Ancho x Alto</label>
                <div>
                    <input type="text" readOnly value={anchoPanelCmDisplay ? `${anchoPanelCmDisplay} cm` : ''} placeholder="Ancho panel (cm)" />
                    <input type="text" readOnly value={altoPanelCmDisplay ? `${altoPanelCmDisplay} cm` : ''} placeholder="Alto panel (cm)" style={{ marginLeft: 8 }} />
                </div>
            </div>

            {/* Vista previa */}
            <div className="opening-preview-box">
                <h4 className="opening-preview-title">Vista previa (no guardada)</h4>
                {(openingForm.typeId && openingForm.widthCm && openingForm.heightCm && Number(openingForm.widthCm) > 0 && Number(openingForm.heightCm) > 0) ? (
                    <div className="opening-preview-text">
                        <div style={{ color: '#817d7dff', fontSize: 14 }}>
                            <div><strong>Tipo:</strong> {openingTypes.find(t => String(t.id) === String(openingForm.typeId))?.name || '-'}</div>
                            <div><strong>Medidas:</strong> {openingForm.widthCm} x {openingForm.heightCm} cm</div>
                            <div><strong>Paneles:</strong> {numPanelsWidth} x {numPanelsHeight} (total {numPanelsWidth * numPanelsHeight})</div>
                            <div><strong>Tamaño panel:</strong> {anchoPanelCmDisplay || '-'} x {altoPanelCmDisplay || '-'} cm</div>
                        </div>
                        <div className="opening-preview-svg-dark">
                            {Number(openingForm.widthCm) > 0 && Number(openingForm.heightCm) > 0 && (
                                (() => {
                                    const w = Number(openingForm.widthCm);
                                    const h = Number(openingForm.heightCm);
                                    const vw = Math.min(300, w * 2);
                                    const vh = Math.min(200, h * 2);
                                    const viewW = w;
                                    const viewH = h;
                                    return (
                                        <svg width={vw} height={vh} viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMidYMid meet">
                                            <rect x="0" y="0" width={viewW} height={viewH} fill="#dff0f8" stroke="#26b7cd" strokeWidth={0.3} />
                                            {Array.from({ length: Math.max(0, numPanelsWidth - 1) }).map((_, i) => (
                                                <line key={`v-${i}`} x1={( (i + 1) * viewW / numPanelsWidth)} y1={0} x2={( (i + 1) * viewW / numPanelsWidth)} y2={viewH} stroke="#2c2727" strokeWidth={1.15} />
                                            ))}
                                            {Array.from({ length: Math.max(0, numPanelsHeight - 1) }).map((_, i) => (
                                                <line key={`h-${i}`} x1={0} y1={((i + 1) * viewH / numPanelsHeight)} x2={viewW} y2={((i + 1) * viewH / numPanelsHeight)} stroke="#1f1c1c" strokeWidth={1.15} />
                                            ))}
                                        </svg>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ color: '#888' }}>Complete tipo, ancho y alto para ver la vista previa.</div>
                )}
            </div>

            {panelDiffers && (
                <div style={{ color: "#e67e22", marginBottom: 8 }}>
                    <b>Advertencia:</b> Ha modificado la cantidad de paneles sugerida ({suggestedPanels.numPanelsWidth} x {suggestedPanels.numPanelsHeight}). El tamaño de panel se recalculará en función de la nueva cantidad.
                </div>
            )}

            {/* Cantidad */}
            <div className="form-group">
                <label>Cantidad</label>
                <input
                    type="number"
                    value={openingForm.quantity || 1}
                    onChange={e => handleInputChange("quantity", e.target.value)}
                    className={(localErrors.quantity || errors.quantity) ? "input-error" : ""}
                    placeholder="Cantidad"
                />
                {(localErrors.quantity || errors.quantity) && <span className="error-message">{localErrors.quantity || errors.quantity}</span>}
            </div>

            {/* Tratamiento - CORREGIDO */}
            <div className="form-group">
                <label>Tratamiento</label>
                <select
                    value={openingForm.treatmentId || ''}
                    onChange={e => handleInputChange("treatmentId", e.target.value)}
                    className={(localErrors.treatmentId || errors.treatmentId) ? "input-error" : ""}
                >
                    <option value="">Seleccione tratamiento</option>
                    {safeArray(treatments).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                {/* Mostrar errores tanto de localErrors como de errors */}
                {(localErrors.treatmentId || errors.treatmentId) && <span className="error-message">{localErrors.treatmentId || errors.treatmentId}</span>}
            </div>

            {/* Tipo de vidrio - CORREGIDO */}
            <div className="form-group">
                <label>Tipo de vidrio</label>
                <select
                    value={openingForm.glassTypeId || ''}
                    onChange={e => handleInputChange("glassTypeId", e.target.value)}
                    className={(localErrors.glassTypeId || errors.glassTypeId) ? "input-error" : ""}
                >
                    <option value="">Seleccione tipo de vidrio</option>
                    {safeArray(glassTypes).map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
                {/* Mostrar errores tanto de localErrors como de errors */}
                {(localErrors.glassTypeId || errors.glassTypeId) && <span className="error-message">{localErrors.glassTypeId || errors.glassTypeId}</span>}
            </div>

            {/* Mosquitero */}
            <div className="form-group">
                <label>
                    <input
                        type="checkbox"
                        checked={!!openingForm.mosquito}
                        onChange={e => handleInputChange("mosquito", e.target.checked)}
                        style={{ marginRight: 8 }}
                    />
                    Tela mosquitera (agrega precio por m²)
                </label>
            </div>

            <button className="botton-carusel" type="button" onClick={handleAddOpening}>
                Agregar Abertura
            </button>
        </div>
    );
};

export default OpeningType;