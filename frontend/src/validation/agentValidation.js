export function validateAgent(agent, options = {}) {
    const { realTime = false, forSummary = false } = options;
    const errors = {};
    
    if (!agent) return { valid: true, errors }; // Si no hay agente, es válido

    // Validaciones para el resumen (estrictas)
    if (forSummary) {
        if (!agent.name || agent.name.trim() === "") 
            errors.name = "Nombre del agente requerido";
        else if (/[0-9]/.test(agent.name)) 
            errors.name = "El nombre no puede contener números";
        if (!agent.lastname || agent.lastname.trim() === "") 
            errors.lastname = "Apellido de agente requerido";
        else if (/[0-9]/.test(agent.lastname)) 
            errors.lastname = "El apellido no puede contener números";
        if (!agent.tel ||  !/^\d{5,14}$/.test(agent.tel)) 
            errors.tel = "Teléfono del agente inválido";
        if (!agent.mail || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(agent.mail)) 
            errors.mail = "Email de agente inválido";
    }

    return { valid: Object.keys(errors).length === 0, errors };
}