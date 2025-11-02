export function validateComplements(complements, options = {}) {
    const { realTime = false, forSummary = false } = options;
    const errors = {};
    
    if (!Array.isArray(complements)) return { valid: true, errors };

    // Validaciones para el resumen (estrictas)
    if (forSummary) {
        complements.forEach((c, idx) => {
            // Validar tipo y complementId
            if (!c.type || !c.complementId) errors[`id_${idx}`] = "Complemento inválido";
            if (!c.quantity || Number(c.quantity) <= 0) errors[`quantity_${idx}`] = "Cantidad de complementos inválida";
            
            // Validaciones personalizadas por tipo
            if (c.type === 'door') {
                if (!c.custom?.width || !c.custom?.height) errors[`size_${idx}`] = "Ingrese ancho y alto";
                if (!c.custom?.coating) errors[`coating_${idx}`] = "Seleccione un revestimiento";
                // NUEVA VALIDACIÓN: Verificar accesorios incompletos
                if (c.custom?.accesories && c.custom.accesories.length > 0) {
                    const invalidAccesory = c.custom.accesories.find(acc => !acc.name || !acc.quantity || Number(acc.quantity) <= 0);
                    if (invalidAccesory) errors[`accesories_${idx}`] = "Complete todos los accesorios";
                }
            }
            
            if (c.type === 'partition') {
                if (!c.custom?.height) errors[`height_${idx}`] = "Ingrese alto";
                if (!c.custom?.glassMilimeters) errors[`glass_${idx}`] = "Seleccione espesor de vidrio";
            }
            
            if (c.type === 'railing') {
                if (!c.custom?.treatment) errors[`treatment_${idx}`] = "Seleccione tratamiento";
            }
        });
    }

    return { valid: Object.keys(errors).length === 0, errors };
}