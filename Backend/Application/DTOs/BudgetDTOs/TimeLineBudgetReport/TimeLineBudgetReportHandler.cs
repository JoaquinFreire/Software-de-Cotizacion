using Domain.Repositories;
using MediatR;
using System.Linq;

namespace Application.DTOs.BudgetDTOs.TimeLineBudgetReport
{
    public class TimeLineBudgetReportHandler : IRequestHandler<TimeLineBudgetReportQuery, TimeLineBudgetReportDTO>
    {
        private readonly IBudgetRepository _budgetRepository;

        public TimeLineBudgetReportHandler(IBudgetRepository budgetRepository)
        {
            _budgetRepository = budgetRepository;
        }

        public async Task<TimeLineBudgetReportDTO> Handle(TimeLineBudgetReportQuery request, CancellationToken cancellationToken)
        {
            var budgets = await _budgetRepository.GetBudgetsByBudgetIdAsync(request.BudgetId);

            if (budgets == null || !budgets.Any())
                throw new KeyNotFoundException($"No se encontraron cotizaciones con BudgetId {request.BudgetId}");

            try
            {
                var report = new TimeLineBudgetReportDTO
                {
                    BudgetId = request.BudgetId,
                    Versions = budgets
                        .OrderBy(b => b.version)
                        .Select(b => new BudgetVersionDTO
                        {
                            Version = b.version,
                            CreationDate = b.creationDate,
                            Status = b.status,
                            User = b.user == null ? "N/A" : $"{b.user.name} {b.user.lastName}",
                            Customer = b.customer == null ? "N/A" : $"{b.customer.name} {b.customer.lastname}",
                            Agent = b.agent == null ? "N/A" : $"{b.agent.name} {b.agent.lastname}",
                            Total = b.Total,
                            Comment = b.Comment
                        }).ToList()
                };

                return report;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error mapeando budgets: {ex.Message}", ex);
            }
        }

    }
}
