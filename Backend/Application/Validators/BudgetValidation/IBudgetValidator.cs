using Domain.Entities;

namespace Application.Validators.BudgetValidation
{
    public interface IBudgetValidator
    {
        void Validate(Budget budget);
    }
}
