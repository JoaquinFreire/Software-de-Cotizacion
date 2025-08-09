using Domain.Validators;
using Domain.Entities;

namespace Application.Validators.CustomerValidation
{
    public class CustomerValidator : ICustomerValidator
    {
        public void Validate(Customer customer)
        {
            CustomerRules.ValidateDni(customer);
            CustomerRules.ValidateName(customer);
            CustomerRules.ValidateLastName(customer);
            CustomerRules.ValidateTelephoneNumber(customer);
            CustomerRules.ValidateEmail(customer);
            CustomerRules.ValidateAddress(customer);
        }
    }
}
