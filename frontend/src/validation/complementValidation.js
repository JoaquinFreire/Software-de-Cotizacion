export function validateComplements(complements) {
    const errors = {};
    if (!Array.isArray(complements)) return { valid: true, errors };
    complements.forEach((c, idx) => {
        if (!c.id) errors[`id_${idx}`] = "Complemento inválido";
        if (!c.quantity || c.quantity <= 0) errors[`quantity_${idx}`] = "Cantidad de complementos inválida";
    });
    return { valid: Object.keys(errors).length === 0, errors };
}
