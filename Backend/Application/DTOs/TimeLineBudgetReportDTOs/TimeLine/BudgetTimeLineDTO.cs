using Domain.Enums;

namespace Application.DTOs.TimeLineBudgetReportDTOs.TimeLine
{
    public class BudgetTimeLineDTO
    {
        public string BudgetId { get; set; } = string.Empty;
        public string WorkPlaceName { get; set; } = string.Empty;
        public DateTime CreationDate { get; set; }
        public BudgetStatus Status { get; set; }
        public List<BudgetVersionDTO> Versions { get; set; } = new();
    }
}
