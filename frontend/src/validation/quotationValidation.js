import { validateCustomer } from "./customerValidation";
import { validateAgent } from "./agentValidation";
import { validateWorkPlace } from "./workPlaceValidation";
import { validateOpenings } from "./openingValidation";
import { validateComplements } from "./complementValidation";
import { validateExtras } from "./extrasValidation";

export function validateQuotation({ customer, agent, agents, workPlace, openings, complements, comment }, options = {}) {
    const { forSummary = false } = options;
    
    const customerResult = validateCustomer(customer, { forSummary });
    
    let agentResult = { valid: true, errors: {} };
    if (!agents || agents.length === 0) {
        agentResult = customer.agentId ? { valid: true, errors: {} } : validateAgent(agent, { forSummary });
    }

    const workPlaceResult = validateWorkPlace(workPlace, { forSummary });
    const openingsResult = validateOpenings(openings, complements, { forSummary });
    const complementsResult = validateComplements(complements, { forSummary });
    const extrasResult = validateExtras(comment, { forSummary });

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