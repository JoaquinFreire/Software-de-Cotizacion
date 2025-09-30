using MediatR;

namespace Application.DTOs.TimeLineBudgetReportDTOs.TimeLine
{
    public class TimelineQuery : IRequest<List<BudgetTimeLineDTO>>
    {
        public string CustomerDni { get; set; } = string.Empty; // Cambiar a DNI
        public string? BudgetIdFilter { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}