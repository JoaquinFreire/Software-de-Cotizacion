using Domain.Entities;
using Domain.Validators;

namespace Application.Validators.CustomerAgentValidation
{
    public class CustomerAgentValidator : ICustomerAgentValidator
    {
        private readonly IdentityValidation _identityValidation;
        public CustomerAgentValidator(IdentityValidation identityValidation)
        {
            _identityValidation = identityValidation;
        }
        public async Task Validate(CustomerAgent customerAgent)
        {
            await _identityValidation.ValidateUniqueDniAsync(customerAgent.dni, "Agent");
            GeneralRules.ValidateDni(customerAgent.dni);
            GeneralRules.ValidateNameAndLastName(customerAgent.name, customerAgent.lastname);
            GeneralRules.ValidateTelephoneNumber(customerAgent.tel);
            GeneralRules.ValidateEmail(customerAgent.mail);
        }
    }
}
