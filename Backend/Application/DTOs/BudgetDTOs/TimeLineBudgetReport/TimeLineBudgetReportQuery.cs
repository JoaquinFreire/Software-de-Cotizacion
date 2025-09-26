using MediatR;

namespace Application.DTOs.BudgetDTOs.TimeLineBudgetReport
{
    public record TimeLineBudgetReportQuery(string BudgetId) : IRequest<TimeLineBudgetReportDTO>
    {
    }
}
