using Application.DTOs.BudgetDTOs.CreateBudget;

namespace Application.DTOs.BudgetDTOs.UpdateBudget
{
    public class CreateBudgetVersionDTO
    {
        public required string OriginalBudgetId { get; set; }
        public CreateBudgetDTO BudgetData { get; set; } // ← Usa la misma estructura
    }
}