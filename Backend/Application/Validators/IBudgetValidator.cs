using Domain.Entities;

namespace Application.Validators
{
    public interface IBudgetValidator
    {
        void Validate(Budget budget);
    }
}
