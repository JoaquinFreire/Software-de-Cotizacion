using Application.DTOs.BudgetDTOs.CreateBudget;

namespace Application.Validators
{
    public interface IApplicationBudgetValidator
    {
        void Validate(CreateBudgetDTO dto);
    }
}
