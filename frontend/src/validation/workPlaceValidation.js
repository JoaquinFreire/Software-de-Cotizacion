export function validateWorkPlace(workPlace, options = {}) {
    const { realTime = false, forSummary = false } = options;
    const errors = {};

    if (realTime) {
        if (workPlace.name && /[0-9]/.test(workPlace.name)) 
            errors.name = "El nombre no puede contener números";
    }

    if (forSummary) {
        if (!workPlace.name || workPlace.name.trim() === "") 
            errors.name = "Nombre de espacio de trabajo requerido";
        else if (/[0-9]/.test(workPlace.name)) 
            errors.name = "El espacio de trabajo no puede contener números";
        if (!workPlace.location || workPlace.location.trim() === "")
            errors.location = "Ubicación requerida (ciudad y barrio)";
        if (!workPlace.address || workPlace.address.trim() === "") 
            errors.address = "Dirección de espacio de trabajo requerida";
        if (!workPlace.workTypeId) 
            errors.workTypeId = "Tipo de trabajo requerido";
        if (!workPlace.selectedCiudad || workPlace.selectedCiudad.trim() === "")
            errors.selectedCiudad = "Ciudad requerida";
        if (!workPlace.selectedBarrio || workPlace.selectedBarrio.trim() === "")
            errors.selectedBarrio = "Barrio requerido";
    }

    return { valid: Object.keys(errors).length === 0, errors };
}