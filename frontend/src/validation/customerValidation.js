export function validateCustomer(customer) {
    const errors = {};
    if (!customer.dni || !/^\d{8,10}$/.test(customer.dni)) errors.dni = "DNI inválido, debe tener 8 digitos numéricos";
    if (!customer.name || customer.name.trim() === "") errors.name = "Nombre de cliente requerido";
    if (!customer.lastname || customer.lastname.trim() === "") errors.lastname = "Apellido de cliente requerido";
    if (!customer.tel || customer.tel.trim().length < 8) errors.tel = "Telefono de cliente inválido";
    if (!customer.mail || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(customer.mail)) errors.mail = "Email de cliente inválido";
    if (!customer.address || customer.address.trim() === "") errors.address = "Dirección de cliente requerida";
    return { valid: Object.keys(errors).length === 0, errors };
}
