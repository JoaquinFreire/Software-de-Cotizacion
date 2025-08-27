using Application.DTOs.BudgetDTOs.CreateBudget;

namespace Application.Validators.BudgetValidation
{
    public interface IApplicationBudgetValidator
    {
        void Validate(CreateBudgetDTO dto);
    }
}
