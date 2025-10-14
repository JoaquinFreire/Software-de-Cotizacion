using Application.DTOs.OperativeEfficiencyDashboard.Constants;
using Application.DTOs.OperativeEfficiencyDashboard.Workload;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using System.Linq;

namespace Application.DTOs.OperativeEfficiencyDashboard.Workload
{
    public class GetWorkloadHandler : IRequestHandler<GetWorkloadQuery, List<WorkloadDTO>>
    {
        private readonly BudgetServices _budgetServices;
        private readonly UserServices _userServices;
        private readonly QuotationServices _quotationServices; // Nuevo

        public GetWorkloadHandler(
            BudgetServices budgetServices,
            UserServices userServices,
            QuotationServices quotationServices) // Agregar
        {
            _budgetServices = budgetServices;
            _userServices = userServices;
            _quotationServices = quotationServices;
        }

        public async Task<List<WorkloadDTO>> Handle(GetWorkloadQuery request, CancellationToken cancellationToken)
        {
            // Normalizar el parámetro timeRange
            var normalizedTimeRange = NormalizeTimeRange(request.TimeRange);
            var (startDate, endDate) = GetDateRange(normalizedTimeRange);

            var allUsers = await _userServices.GetAllAsync();
            var quoters = allUsers.Where(u =>
                u.status == 1 &&
                (u.role?.role_name == "quotator" || u.role?.role_name == "coordinator" || u.role?.role_name == "manager")
            ).ToList();

            var allBudgets = await _budgetServices.GetAllBudgetsAsync();
            var filteredBudgets = allBudgets
                .Where(b => b.creationDate >= startDate && b.creationDate <= endDate)
                .ToList();

            // Obtener todas las cotizaciones de SQL para el período
            var allQuotations = await _quotationServices.GetAllAsync();
            var filteredQuotations = allQuotations
                .Where(q => q.CreationDate >= startDate && q.CreationDate <= endDate)
                .ToList();

            Console.WriteLine($"DEBUG WORKLOAD: Budgets MongoDB: {filteredBudgets.Count}, Quotations SQL: {filteredQuotations.Count}");

            var workloadData = new List<WorkloadDTO>();

            foreach (var quoter in quoters)
            {
                // Contar desde SQL (fuente de verdad para asignación de usuarios)
                var userQuotations = filteredQuotations
                    .Where(q => q.UserId == quoter.id)
                    .ToList();

                // Obtener los budgetIds de las cotizaciones del usuario para buscar en MongoDB
                var userBudgetIds = userQuotations.Select(q => q.Id.ToString()).ToList();

                // Buscar en MongoDB solo las cotizaciones que pertenecen a este usuario en SQL
                var userBudgets = filteredBudgets
                    .Where(b => userBudgetIds.Contains(b.budgetId))
                    .ToList();

                var activeQuotations = userBudgets.Count(b =>
                    DashboardConstants.Statuses.ActiveStatuses.Contains(b.status));

                var pendingQuotations = userBudgets.Count(b =>
                    b.status == BudgetStatus.Pending);

                var delayedQuotations = userBudgets.Count(b =>
                    DashboardConstants.Statuses.ActiveStatuses.Contains(b.status) &&
                    (DateTime.UtcNow - b.creationDate).TotalDays > DashboardConstants.Thresholds.DaysWithoutEditYellow);

                var efficiency = CalculateUserEfficiency(userBudgets);
                var alerts = CalculateUserAlerts(activeQuotations, delayedQuotations, efficiency, userBudgets.Count);

                Console.WriteLine($"DEBUG USER: {quoter.name} - Cotizaciones SQL: {userQuotations.Count}, Budgets MongoDB: {userBudgets.Count}");

                workloadData.Add(new WorkloadDTO
                {
                    UserId = quoter.id,
                    UserName = $"{quoter.name} {quoter.lastName}",
                    UserEmail = quoter.mail,
                    ActiveQuotations = activeQuotations,
                    PendingQuotations = pendingQuotations,
                    DelayedQuotations = delayedQuotations,
                    Efficiency = efficiency,
                    Alerts = alerts
                });
            }

            return workloadData.OrderByDescending(w => w.ActiveQuotations).ToList();
        }

        // Los demás métodos permanecen igual...
        private decimal CalculateUserEfficiency(List<Budget> userBudgets)
        {
            var totalBudgets = userBudgets.Count;
            if (totalBudgets == 0) return -1;

            var completedBudgets = userBudgets.Count(b =>
                DashboardConstants.Statuses.CompletedStatuses.Contains(b.status));

            return Math.Round((decimal)completedBudgets / totalBudgets * 100, 2);
        }

        private WorkloadAlertsDTO CalculateUserAlerts(int activeQuotations, int delayedQuotations, decimal efficiency, int totalBudgets)
        {
            var alerts = new WorkloadAlertsDTO();

            if (totalBudgets == 0 || efficiency == -1)
            {
                alerts.Active = "gray";
                alerts.Delayed = "gray";
                alerts.Overall = "gray";
                return alerts;
            }

            alerts.Active = activeQuotations >= DashboardConstants.Thresholds.ActiveQuotationsRed ? "red" :
                           activeQuotations >= DashboardConstants.Thresholds.ActiveQuotationsYellow ? "yellow" : "green";

            alerts.Delayed = delayedQuotations >= DashboardConstants.Thresholds.DaysWithoutEditRed ? "red" :
                            delayedQuotations >= DashboardConstants.Thresholds.DaysWithoutEditYellow ? "yellow" : "green";

            alerts.Overall = efficiency <= DashboardConstants.Thresholds.EfficiencyRed ? "red" :
                            efficiency <= DashboardConstants.Thresholds.EfficiencyYellow ? "yellow" : "green";

            return alerts;
        }

        private (DateTime startDate, DateTime endDate) GetDateRange(string timeRange)
        {
            var endDate = DateTime.UtcNow;
            DateTime startDate = timeRange switch
            {
                DashboardConstants.TimeRanges.Last7Days => endDate.AddDays(-7),
                DashboardConstants.TimeRanges.Last30Days => endDate.AddDays(-30),
                DashboardConstants.TimeRanges.Last90Days => endDate.AddDays(-90),
                _ => endDate.AddDays(-30)
            };
            return (startDate, endDate);
        }

        private string NormalizeTimeRange(string timeRange)
        {
            return timeRange?.ToLower() switch
            {
                "7" or "7d" or "last7days" => DashboardConstants.TimeRanges.Last7Days,
                "30" or "30d" or "last30days" => DashboardConstants.TimeRanges.Last30Days,
                "90" or "90d" or "last90days" => DashboardConstants.TimeRanges.Last90Days,
                _ => DashboardConstants.TimeRanges.Last30Days
            };
        }
    }
}