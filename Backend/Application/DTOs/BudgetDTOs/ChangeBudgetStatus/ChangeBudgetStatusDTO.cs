using Domain.Enums;

namespace Application.DTOs.BudgetDTOs.ChangeBudgetStatus
{
    public class ChangeBudgetStatusDTO
    {
        public BudgetStatus Status { get; set; }
        public string? Comment { get; set; }
    }
}
