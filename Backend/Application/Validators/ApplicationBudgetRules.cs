using Application.DTOs.BudgetDTOs.CreateBudget;
using Domain.Exceptions;

namespace Application.Validators
{
    public class ApplicationBudgetValidator : IApplicationBudgetValidator
    {
        public void Validate(CreateBudgetDTO dto)
        {
            if (string.IsNullOrEmpty(dto.budgetId))
                throw new BusinessException("El ID del presupuesto no puede estar vacío.");

            if (dto.Products == null || !dto.Products.Any())
                throw new BusinessException("Debe agregar al menos un producto.");
        }
    }
}
