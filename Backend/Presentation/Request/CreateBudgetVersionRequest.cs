using Application.DTOs.BudgetDTOs.CreateBudget;

namespace Presentation.Request
{
    public class CreateBudgetVersionRequest
    {
        public required string OriginalBudgetId { get; set; }
        public CreateBudgetDTO Budget { get; set; } // ← Misma estructura que CreateBudget
    }
}