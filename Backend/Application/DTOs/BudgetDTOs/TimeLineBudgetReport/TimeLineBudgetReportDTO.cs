
using Domain.Enums;

namespace Application.DTOs.BudgetDTOs.TimeLineBudgetReport
{
    public class TimeLineBudgetReportDTO
    {
        public string BudgetId { get; set; }
        public List<BudgetVersionDTO> Versions { get; set; } = new();
    }

    public class BudgetVersionDTO
    {
        public int Version { get; set; }
        public DateTime CreationDate { get; set; }
        public BudgetStatus Status { get; set; }
        public string User { get; set; } // user.name + lastname
        public string Customer { get; set; }
        public string Agent { get; set; }
        public decimal Total { get; set; }
        public string Comment { get; set; }
    }
}
