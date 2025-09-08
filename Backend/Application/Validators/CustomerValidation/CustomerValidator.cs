using Domain.Validators;
using Application.Validators;
using Domain.Entities;

namespace Application.Validators.CustomerValidation
{
    public class CustomerValidator : ICustomerValidator
    {
        private readonly IdentityValidation _identityValidation;
        public CustomerValidator(IdentityValidation identityValidation)
        {
            _identityValidation = identityValidation;
        }
        public async Task Validate(Customer customer)
        {
            
            await _identityValidation.ValidateUniqueDniAsync(customer.dni, "Customer");
            GeneralRules.ValidateDni(customer.dni);
            GeneralRules.ValidateNameAndLastName(customer.name, customer.lastname);
            GeneralRules.ValidateTelephoneNumber(customer.tel);
            GeneralRules.ValidateEmail(customer.mail);
            GeneralRules.ValidateAddress(customer.address);
        }
    }
}
