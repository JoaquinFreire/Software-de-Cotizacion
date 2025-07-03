using Application.DTOs.CreateBudget;

namespace Application.Validators
{
    public interface IApplicationBudgetValidator
    {
        void Validate(CreateBudgetDTO dto);
    }
}
