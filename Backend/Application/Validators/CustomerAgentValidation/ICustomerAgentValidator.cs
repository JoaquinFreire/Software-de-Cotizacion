using Domain.Entities;

namespace Application.Validators.CustomerAgentValidation
{
    public interface ICustomerAgentValidator
    {
        Task Validate(CustomerAgent customerAgent);
    }
}
