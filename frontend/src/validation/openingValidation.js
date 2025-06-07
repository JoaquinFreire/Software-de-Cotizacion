export function validateOpenings(openings) {
    const errors = {};
    if (!Array.isArray(openings) || openings.length === 0) {
        errors.openings = "Debe agregar al menos una abertura";
    } else {
        openings.forEach((o, idx) => {
            if (!o.typeId) errors[`typeId_${idx}`] = "Tipo de abertura requerido";
            if (!o.width || o.width <= 0) errors[`width_${idx}`] = "Ancho inválido";
            if (!o.height || o.height <= 0) errors[`height_${idx}`] = "Alto inválido";
            if (!o.quantity || o.quantity <= 0) errors[`quantity_${idx}`] = "Cantidad de aberturas inválida";
            if (!o.treatmentId) errors[`treatmentId_${idx}`] = "Tratamiento requerido";
            if (!o.glassTypeId) errors[`glassTypeId_${idx}`] = "Tipo de vidrio requerido";
        });
    }
    return { valid: Object.keys(errors).length === 0, errors };
}
