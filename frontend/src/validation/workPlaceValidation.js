export function validateWorkPlace(workPlace) {
    const errors = {};
    if (!workPlace.name || workPlace.name.trim() === "") errors.name = "Nombre de espacio de trabajo requerido";
    if (!workPlace.address || workPlace.address.trim() === "") errors.address = "Dirección de espacio de trabajo requerida";
    if (!workPlace.workTypeId) errors.workTypeId = "Tipo de trabajo requerido";
    return { valid: Object.keys(errors).length === 0, errors };
}
