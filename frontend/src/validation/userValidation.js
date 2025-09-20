export function validateUser(user, isEdit = false) {
    const errors = {};

    // Si no es edición, validar Nombre, Apellido y Legajo
    if (!isEdit) {
        // Nombre
        if (!user.name || user.name.trim().length < 2) {
            errors.name = "El nombre es obligatorio y debe tener al menos 2 caracteres.";
        }

        // Apellido
        if (!user.lastName || user.lastName.trim().length < 2) {
            errors.lastName = "El apellido es obligatorio y debe tener al menos 2 caracteres.";
        }

        // Legajo (DNI)
        if (!user.legajo || !/^\d{6,10}$/.test(user.legajo.trim())) {
            errors.legajo = "El DNI es obligatorio y debe ser un número válido.";
        }
    }

    // Email
    if (!user.mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.mail.trim())) {
        errors.mail = "El email es obligatorio y debe tener un formato válido.";
    }

    // Rol
    if (!user.role_id || user.role_id === "") {
        errors.role_id = "Debe seleccionar un rol.";
    }

    return errors;
}
