export function validateComplements(complements) {
    const errors = {};
    if (!Array.isArray(complements)) return { valid: true, errors };
    complements.forEach((c, idx) => {
        // Validar tipo y complementId
        if (!c.type || !c.complementId) errors[`id_${idx}`] = "Complemento inválido";
        if (!c.quantity || Number(c.quantity) <= 0) errors[`quantity_${idx}`] = "Cantidad de complementos inválida";
        // Validaciones personalizadas por tipo
        if (c.type === 'door') {
            if (!c.custom?.width || !c.custom?.height) errors[`size_${idx}`] = "Ingrese ancho y alto";
            if (!c.custom?.coating) errors[`coating_${idx}`] = "Seleccione un revestimiento";
        }
        if (c.type === 'partition') {
            if (!c.custom?.height) errors[`height_${idx}`] = "Ingrese alto";
            if (!c.custom?.glassMilimeters) errors[`glass_${idx}`] = "Ingrese espesor de vidrio";
        }
        if (c.type === 'railing') {
            if (!c.custom?.treatment) errors[`treatment_${idx}`] = "Seleccione tratamiento";
        }
    });
    return { valid: Object.keys(errors).length === 0, errors };
}
