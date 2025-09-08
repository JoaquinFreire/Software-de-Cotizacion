using Domain.Entities;

namespace Application.Validators.CustomerValidation
{
    public interface ICustomerValidator
    {
        Task Validate(Customer customer);

    }
}
