using Application.DTOs.BudgetDTOs.CreateBudget;
using Domain.Exceptions;

namespace Application.Validators.BudgetValidation
{
    public class ApplicationBudgetVersionValidator : IApplicationBudgetValidator
    {
        public void Validate(CreateBudgetDTO dto)
        {
            if (string.IsNullOrEmpty(dto.budgetId))
                throw new BusinessException("El ID del presupuesto no puede estar vacío.");
        }
    }
}