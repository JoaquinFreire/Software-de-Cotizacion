import { validateCustomer } from "./customerValidation";
import { validateAgent } from "./agentValidation";
import { validateWorkPlace } from "./workPlaceValidation";
import { validateOpenings } from "./openingValidation";
import { validateComplements } from "./complementValidation";
import { validateExtras } from "./extrasValidation";

export function validateQuotation({ customer, agent, agents, workPlace, openings, complements, comment }) {
    const customerResult = validateCustomer(customer);

    // Cambia la lógica: si hay agentes agregados, no valida el agente individual
    let agentResult = { valid: true, errors: {} };
    if (!agents || agents.length === 0) {
        agentResult = customer.agentId ? { valid: true, errors: {} } : validateAgent(agent);
    }

    const workPlaceResult = validateWorkPlace(workPlace);
    const openingsResult = validateOpenings(openings, complements);
    const complementsResult = validateComplements(complements);
    const extrasResult = validateExtras(comment);

    const errors = {
        ...customerResult.errors,
        ...agentResult.errors,
        ...workPlaceResult.errors,
        ...openingsResult.errors,
        ...complementsResult.errors,
        ...extrasResult.errors,
    };

    return { valid: Object.keys(errors).length === 0, errors };
}
