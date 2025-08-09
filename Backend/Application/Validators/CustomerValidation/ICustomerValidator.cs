using Domain.Entities;

namespace Application.Validators.CustomerValidation
{
    public interface ICustomerValidator
    {
        void Validate(Customer customer);

    }
}
