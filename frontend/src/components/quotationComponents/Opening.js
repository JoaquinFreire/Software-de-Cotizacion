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
    openingConfigurations = [],
    onLogOpening, // <-- nueva prop
}) => {
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
        // Validar que todos los campos estén completos
        if (!typeId || !width || !height || quantity <= 0 || !treatmentId || !glassTypeId) {
            console.error('Todos los campos son obligatorios');
            return;
        }
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
            mosquito: openingForm.mosquito ? true : false // <-- nuevo campo
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
        if (errors[field]) {
            errors[field] = undefined;
        }
    };

    // Cuando muestres sugerencias y campos de panel, usa cm en vez de mm
    // Ejemplo para sugerencia:
    const sugerencia = suggestedConfig
        ? `Sugerencia: ${suggestedConfig.num_panels_width} panel(es) de ancho x ${suggestedConfig.num_panels_height} panel(es) de alto.`
        : "";

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
            {sugerencia && (
                <div className="panel-suggestion" style={{ marginTop: 12, color: "#26b7cd" }}>
                    <strong>{sugerencia}</strong>
                </div>
            )}

            {/* Cantidad de paneles (ancho y alto) en lugar de tamaño manual de panel */}
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

            {/* Mostrar tamaño de panel calculado (cm) */}
            <div className="form-group">
                <label>Tamaño de panel (cm) — Ancho x Alto</label>
                <div>
                    <input type="text" readOnly value={anchoPanelCmDisplay ? `${anchoPanelCmDisplay} cm` : ''} placeholder="Ancho panel (cm)" />
                    <input type="text" readOnly value={altoPanelCmDisplay ? `${altoPanelCmDisplay} cm` : ''} placeholder="Alto panel (cm)" style={{ marginLeft: 8 }} />
                </div>
            </div>

            {/* --- VISTA PREVIA EN TIEMPO REAL --- */}
            <div className="opening-preview-box">
                <h4 className="opening-preview-title">Vista previa (no guardada)</h4>
                {(openingForm.typeId && openingForm.widthCm && openingForm.heightCm && Number(openingForm.widthCm) > 0 && Number(openingForm.heightCm) > 0) ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexDirection: 'column' }}>
                        <div style={{ color: '#fff', fontSize: 13 }}>
                            <div><strong>Tipo:</strong> {openingTypes.find(t => String(t.id) === String(openingForm.typeId))?.name || '-'}</div>
                            <div><strong>Medidas:</strong> {openingForm.widthCm} x {openingForm.heightCm} cm</div>
                            <div><strong>Paneles:</strong> {numPanelsWidth} x {numPanelsHeight} (total {numPanelsWidth * numPanelsHeight})</div>
                            <div><strong>Tamaño panel:</strong> {anchoPanelCmDisplay || '-'} x {altoPanelCmDisplay || '-'} cm</div>
                        </div>
                        <div className="opening-preview-svg-dark">
                            {/* SVG sencillo que muestra la abertura y las divisiones de paneles */}
                            {Number(openingForm.widthCm) > 0 && Number(openingForm.heightCm) > 0 && (
                                (() => {
                                    const w = Number(openingForm.widthCm);
                                    const h = Number(openingForm.heightCm);
                                    const vw = Math.min(300, w * 2); // visual width px (cap)
                                    const vh = Math.min(200, h * 2); // visual height px
                                    const viewW = w;
                                    const viewH = h;
                                    return (
                                        <svg width={vw} height={vh} viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMidYMid meet">
                                            <rect x="0" y="0" width={viewW} height={viewH} fill="#dff0f8" stroke="#26b7cd" strokeWidth={0.3} />
                                            {/* vertical lines */}
                                            {Array.from({ length: Math.max(0, numPanelsWidth - 1) }).map((_, i) => (
                                                <line key={`v-${i}`} x1={( (i + 1) * viewW / numPanelsWidth)} y1={0} x2={( (i + 1) * viewW / numPanelsWidth)} y2={viewH} stroke="#2c2727" strokeWidth={1.15} />
                                            ))}
                                            {/* horizontal lines */}
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