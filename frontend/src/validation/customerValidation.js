export function validateCustomer(customer, options = {}) {
    const { realTime = false, forSummary = false } = options;
    const errors = {};

    // Validaciones en tiempo real (más permisivas)
    if (realTime) {
        if (customer.dni && !/^\d{8,10}$/.test(customer.dni)) 
            errors.dni = "DNI inválido";
        if (customer.mail && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(customer.mail)) 
            errors.mail = "Email inválido";
        
        // Validaciones en tiempo real para texto sin números
        if (customer.name && /[0-9]/.test(customer.name)) 
            errors.name = "El nombre no puede contener números";
        if (customer.lastname && /[0-9]/.test(customer.lastname)) 
            errors.lastname = "El apellido no puede contener números";
        if (customer.address && /[0-9]/.test(customer.address)) 
            errors.address = "La dirección no puede contener números";
    }

    // Validaciones para el resumen (estrictas)
    if (forSummary) {
        if (!customer.dni || !/^\d{8,10}$/.test(customer.dni)) 
            errors.dni = "DNI inválido, debe tener 8 digitos numéricos";
        
        if (!customer.name || customer.name.trim() === "") 
            errors.name = "Nombre de cliente requerido";
        else if (/[0-9]/.test(customer.name)) 
            errors.name = "El nombre no puede contener números";
        
        if (!customer.lastname || customer.lastname.trim() === "") 
            errors.lastname = "Apellido de cliente requerido";
        else if (/[0-9]/.test(customer.lastname)) 
            errors.lastname = "El apellido no puede contener números";
        
        if (!customer.tel || !/^\d{5,14}$/.test(customer.tel)) 
            errors.tel = "Teléfono de cliente inválido";
        
        if (!customer.mail || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(customer.mail)) 
            errors.mail = "Email de cliente inválido";
        
        if (!customer.address || customer.address.trim() === "") 
            errors.address = "Dirección de cliente requerida";
    }

    return { valid: Object.keys(errors).length === 0, errors };
}