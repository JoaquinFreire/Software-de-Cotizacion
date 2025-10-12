using Application.DTOs.OperativeEfficiencyDashboard.Constants;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using System.Linq;

namespace Application.DTOs.OperativeEfficiencyDashboard.Alerts
{
    public class GetAlertsHandler : IRequestHandler<GetAlertsQuery, List<AlertDTO>>
    {
        private readonly BudgetServices _budgetServices;
        private readonly UserServices _userServices;

        public GetAlertsHandler(
            BudgetServices budgetServices,
            UserServices userServices)
        {
            _budgetServices = budgetServices;
            _userServices = userServices;
        }

        public async Task<List<AlertDTO>> Handle(GetAlertsQuery request, CancellationToken cancellationToken)
        {
            // Normalizar el parámetro timeRange
            var normalizedTimeRange = NormalizeTimeRange(request.TimeRange);
            var normalizedLevel = NormalizeLevel(request.Level);

            var (startDate, endDate) = GetDateRange(normalizedTimeRange);

            var alerts = new List<AlertDTO>();

            // 1. Alertas por sobrecarga de usuarios
            var overloadAlerts = await GetOverloadAlerts(startDate, endDate);
            alerts.AddRange(overloadAlerts);

            // 2. Alertas por inactividad en cotizaciones
            var inactivityAlerts = await GetInactivityAlerts(startDate, endDate);
            alerts.AddRange(inactivityAlerts);

            // 3. Alertas por baja eficiencia
            var efficiencyAlerts = await GetEfficiencyAlerts(startDate, endDate);
            alerts.AddRange(efficiencyAlerts);

            // Filtrar por nivel si se especifica
            if (!string.IsNullOrEmpty(normalizedLevel) && normalizedLevel != "all")
            {
                alerts = alerts.Where(a => a.Level == normalizedLevel).ToList();
            }

            // Eliminar duplicados y ordenar
            return alerts
                .GroupBy(a => new { a.Type, a.QuotationId, a.Assignee, a.Level })
                .Select(g => g.First())
                .OrderByDescending(a => a.Level == "red")
                .ThenByDescending(a => a.Level == "yellow")
                .ThenBy(a => a.Time)
                .ToList();
        }

        private async Task<List<AlertDTO>> GetOverloadAlerts(DateTime startDate, DateTime endDate)
        {
            var alerts = new List<AlertDTO>();
            var allUsers = await _userServices.GetAllAsync();
            var quoters = allUsers.Where(u => u.role?.role_name == "quotator").ToList();

            var allBudgets = await _budgetServices.GetAllBudgetsAsync();
            var filteredBudgets = allBudgets
                .Where(b => b.creationDate >= startDate && b.creationDate <= endDate)
                .ToList();

            foreach (var quoter in quoters)
            {
                var userBudgets = FindUserBudgets(filteredBudgets, quoter);

                var activeCount = userBudgets.Count(b =>
                    DashboardConstants.Statuses.ActiveStatuses.Contains(b.status));

                if (activeCount >= DashboardConstants.Thresholds.ActiveQuotationsRed)
                {
                    alerts.Add(new AlertDTO
                    {
                        Level = "red",
                        Title = "Sobrecarga crítica",
                        Description = $"{quoter.name} {quoter.lastName} tiene {activeCount} cotizaciones activas (límite: {DashboardConstants.Thresholds.ActiveQuotationsRed})",
                        Time = DateTime.UtcNow,
                        Type = "workload",
                        Assignee = $"{quoter.name} {quoter.lastName}",
                        AssigneeId = quoter.id,
                        QuotationId = null,
                        MetricValue = activeCount
                    });
                }
                else if (activeCount >= DashboardConstants.Thresholds.ActiveQuotationsYellow)
                {
                    alerts.Add(new AlertDTO
                    {
                        Level = "yellow",
                        Title = "Carga de trabajo alta",
                        Description = $"{quoter.name} {quoter.lastName} tiene {activeCount} cotizaciones activas (límite: {DashboardConstants.Thresholds.ActiveQuotationsYellow})",
                        Time = DateTime.UtcNow,
                        Type = "workload",
                        Assignee = $"{quoter.name} {quoter.lastName}",
                        AssigneeId = quoter.id,
                        QuotationId = null,
                        MetricValue = activeCount
                    });
                }
            }

            return alerts;
        }

        private async Task<List<AlertDTO>> GetInactivityAlerts(DateTime startDate, DateTime endDate)
        {
            var alerts = new List<AlertDTO>();

            var allBudgets = await _budgetServices.GetAllBudgetsAsync();
            var filteredBudgets = allBudgets
                .Where(b => b.creationDate >= startDate && b.creationDate <= endDate)
                .ToList();

            var allUsers = await _userServices.GetAllAsync();

            var inactiveBudgets = filteredBudgets
                .Where(b => DashboardConstants.Statuses.ActiveStatuses.Contains(b.status))
                .Where(b => (DateTime.UtcNow - b.creationDate).TotalDays > DashboardConstants.Thresholds.DaysWithoutEditYellow);

            foreach (var budget in inactiveBudgets)
            {
                var daysWithoutEdit = (int)(DateTime.UtcNow - budget.creationDate).TotalDays;
                var level = daysWithoutEdit >= DashboardConstants.Thresholds.DaysWithoutEditRed ? "red" : "yellow";

                // Buscar el usuario real en SQL para obtener el ID correcto
                var user = allUsers.FirstOrDefault(u =>
                    u.mail?.Equals(budget.user?.mail, StringComparison.OrdinalIgnoreCase) == true ||
                    ($"{u.name} {u.lastName}".Trim().Equals($"{budget.user?.name} {budget.user?.lastName}".Trim(), StringComparison.OrdinalIgnoreCase)));

                alerts.Add(new AlertDTO
                {
                    Level = level,
                    Title = daysWithoutEdit >= DashboardConstants.Thresholds.DaysWithoutEditRed ?
                           "Inactividad crítica" : "Inactividad prolongada",
                    Description = $"Cotización #{budget.budgetId} - {daysWithoutEdit} días sin actualización",
                    Time = budget.creationDate,
                    Type = "inactivity",
                    QuotationId = budget.budgetId,
                    Assignee = $"{budget.user?.name} {budget.user?.lastName}",
                    AssigneeId = user?.id ?? 0,
                    DaysWithoutEdit = daysWithoutEdit,
                    MetricValue = daysWithoutEdit
                });
            }

            return alerts;
        }

        private async Task<List<AlertDTO>> GetEfficiencyAlerts(DateTime startDate, DateTime endDate)
        {
            var alerts = new List<AlertDTO>();
            var allUsers = await _userServices.GetAllAsync();
            var quoters = allUsers.Where(u => u.role?.role_name == "quotator").ToList();

            var allBudgets = await _budgetServices.GetAllBudgetsAsync();
            var filteredBudgets = allBudgets
                .Where(b => b.creationDate >= startDate && b.creationDate <= endDate)
                .ToList();

            foreach (var quoter in quoters)
            {
                var userBudgets = FindUserBudgets(filteredBudgets, quoter);

                if (userBudgets.Count == 0) continue;

                var efficiency = CalculateUserEfficiency(userBudgets);

                if (efficiency <= DashboardConstants.Thresholds.EfficiencyRed)
                {
                    alerts.Add(new AlertDTO
                    {
                        Level = "red",
                        Title = "Eficiencia crítica",
                        Description = $"{quoter.name} {quoter.lastName} tiene {efficiency:F2}% de eficiencia (mínimo: {DashboardConstants.Thresholds.EfficiencyRed}%)",
                        Time = DateTime.UtcNow,
                        Type = "efficiency",
                        Assignee = $"{quoter.name} {quoter.lastName}",
                        AssigneeId = quoter.id,
                        MetricValue = efficiency
                    });
                }
                else if (efficiency <= DashboardConstants.Thresholds.EfficiencyYellow)
                {
                    alerts.Add(new AlertDTO
                    {
                        Level = "yellow",
                        Title = "Eficiencia baja",
                        Description = $"{quoter.name} {quoter.lastName} tiene {efficiency:F2}% de eficiencia (mínimo: {DashboardConstants.Thresholds.EfficiencyYellow}%)",
                        Time = DateTime.UtcNow,
                        Type = "efficiency",
                        Assignee = $"{quoter.name} {quoter.lastName}",
                        AssigneeId = quoter.id,
                        MetricValue = efficiency
                    });
                }
            }

            return alerts;
        }

        private List<Budget> FindUserBudgets(List<Budget> budgets, User quoter)
        {
            return budgets.Where(b =>
                b.user?.mail?.Equals(quoter.mail, StringComparison.OrdinalIgnoreCase) == true ||
                ($"{b.user?.name} {b.user?.lastName}".Trim().Equals($"{quoter.name} {quoter.lastName}".Trim(), StringComparison.OrdinalIgnoreCase)) ||
                (b.user?.id != null && b.user.id == quoter.id)
            ).ToList();
        }

        private decimal CalculateUserEfficiency(List<Budget> userBudgets)
        {
            var totalBudgets = userBudgets.Count;
            if (totalBudgets == 0) return 0;

            var completedBudgets = userBudgets.Count(b =>
                DashboardConstants.Statuses.CompletedStatuses.Contains(b.status));

            return Math.Round((decimal)completedBudgets / totalBudgets * 100, 2);
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

        private string NormalizeLevel(string level)
        {
            return level?.ToLower() switch
            {
                "red" or "yellow" or "green" or "all" => level.ToLower(),
                _ => "all"
            };
        }
    }
}