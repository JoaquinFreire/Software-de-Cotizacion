export function validateAgent(agent) {
    const errors = {};
    if (!agent) return { valid: true, errors }; // Si no hay agente, es válido
    if (!agent.name || agent.name.trim() === "") errors.name = "Nombre del agente requerido";
    if (!agent.lastname || agent.lastname.trim() === "") errors.lastname = "Apellido de agente requerido";
    if (!agent.tel || agent.tel.trim().length < 6) errors.tel = "Teléfono del agente inválido";
    if (!agent.mail || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(agent.mail)) errors.mail = "Email de agente inválido";
    return { valid: Object.keys(errors).length === 0, errors };
}
