export function validateOpenings(openings, complements = []) {
    const errors = {};
    // Permitir que openings esté vacío si hay complementos
    if ((!Array.isArray(openings) || openings.length === 0) && (!Array.isArray(complements) || complements.length === 0)) {
        errors.openings = "Debe agregar al menos una abertura o un complemento";
    } else if (Array.isArray(openings)) {
        openings.forEach((o, idx) => {
            // Solo validar campos si la abertura está incompleta (no si ya fue agregada correctamente)
            // Considera una abertura válida si tiene typeId, width, height, quantity, treatmentId, glassTypeId y pasa el rango
            const isComplete =
                o.typeId &&
                (o.width || o.width === 0) &&
                (o.height || o.height === 0) &&
                o.quantity &&
                o.treatmentId &&
                o.glassTypeId &&
                (o.widthCm === undefined || (o.widthCm >= 50 && o.widthCm <= 1000)) &&
                (o.heightCm === undefined || (o.heightCm >= 50 && o.heightCm <= 1000));

            if (!isComplete) {
                if (!o.typeId) errors[`typeId_${idx}`] = "Tipo de abertura requerido";
                if (!o.width || o.width <= 0) errors[`width_${idx}`] = "Ancho inválido";
                if (!o.height || o.height <= 0) errors[`height_${idx}`] = "Alto inválido";
                if (!o.quantity || o.quantity <= 0) errors[`quantity_${idx}`] = "Cantidad de aberturas inválida";
                if (!o.treatmentId) errors[`treatmentId_${idx}`] = "Tratamiento requerido";
                if (!o.glassTypeId) errors[`glassTypeId_${idx}`] = "Tipo de vidrio requerido";
                if (o.widthCm !== undefined && (o.widthCm < 50 || o.widthCm > 1000))
                    errors[`width_${idx}`] = "El ancho debe estar entre 50cm y 1000cm";
                if (o.heightCm !== undefined && (o.heightCm < 50 || o.heightCm > 1000))
                    errors[`height_${idx}`] = "El alto debe estar entre 50cm y 1000cm";
            }
        });
    }
    return { valid: Object.keys(errors).length === 0, errors };
}
