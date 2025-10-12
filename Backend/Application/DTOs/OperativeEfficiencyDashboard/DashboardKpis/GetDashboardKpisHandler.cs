using Application.DTOs.OperativeEfficiencyDashboard.Alerts;
using Application.DTOs.OperativeEfficiencyDashboard.Constants;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using System.Linq;

namespace Application.DTOs.OperativeEfficiencyDashboard.DashboardKpis
{
    public class GetDashboardKpisHandler : IRequestHandler<GetDashboardKpisQuery, DashboardKpisDTO>
    {
        private readonly BudgetServices _budgetServices;
        private readonly UserServices _userServices;
        private readonly IMediator _mediator;

        public GetDashboardKpisHandler(
            BudgetServices budgetServices,
            UserServices userServices,
            IMediator mediator)
        {
            _budgetServices = budgetServices;
            _userServices = userServices;
            _mediator = mediator;
        }

        public async Task<DashboardKpisDTO> Handle(GetDashboardKpisQuery request, CancellationToken cancellationToken)
        {
            // Normalizar el parámetro timeRange
            var normalizedTimeRange = NormalizeTimeRange(request.TimeRange);

            var (startDate, endDate) = GetDateRange(normalizedTimeRange);
            var (previousStartDate, previousEndDate) = GetPreviousDateRange(normalizedTimeRange);

            // Obtener todos los budgets
            var allBudgets = await _budgetServices.GetAllBudgetsAsync();
            var allBudgetsList = allBudgets.ToList();

            // Filtrar budgets del período actual
            var currentBudgets = allBudgetsList
                .Where(b => b.creationDate >= startDate && b.creationDate <= endDate)
                .ToList();

            // Filtrar budgets del período anterior para tendencias
            var previousBudgets = allBudgetsList
                .Where(b => b.creationDate >= previousStartDate && b.creationDate <= previousEndDate)
                .ToList();

            Console.WriteLine($"DEBUG: Total budgets encontrados: {allBudgetsList.Count}");
            Console.WriteLine($"DEBUG: Budgets en período actual: {currentBudgets.Count}");
            Console.WriteLine($"DEBUG: Budgets en período anterior: {previousBudgets.Count}");

            // Calcular KPIs del período actual
            var activeQuotations = currentBudgets.Count(b =>
                DashboardConstants.Statuses.ActiveStatuses.Contains(b.status));

            var delayedQuotations = currentBudgets.Count(b =>
                DashboardConstants.Statuses.ActiveStatuses.Contains(b.status) &&
                (DateTime.UtcNow - b.creationDate).TotalDays > DashboardConstants.Thresholds.DaysWithoutEditYellow);

            var teamEfficiency = CalculateTeamEfficiency(currentBudgets);

            // Obtener alertas
            var alerts = await _mediator.Send(new GetAlertsQuery
            {
                TimeRange = normalizedTimeRange
            }, cancellationToken);

            var activeAlerts = alerts.Count(a => a.Level == "red" || a.Level == "yellow");

            // Calcular KPIs del período anterior para tendencias
            var previousActiveQuotations = previousBudgets.Count(b =>
                DashboardConstants.Statuses.ActiveStatuses.Contains(b.status));

            var previousDelayedQuotations = previousBudgets.Count(b =>
                DashboardConstants.Statuses.ActiveStatuses.Contains(b.status) &&
                (GetComparisonDate(b.creationDate, previousEndDate) - b.creationDate).TotalDays > DashboardConstants.Thresholds.DaysWithoutEditYellow);

            var previousTeamEfficiency = CalculateTeamEfficiency(previousBudgets);

            return new DashboardKpisDTO
            {
                ActiveQuotations = activeQuotations,
                DelayedQuotations = delayedQuotations,
                TeamEfficiency = teamEfficiency,
                ActiveAlerts = activeAlerts,
                Trends = CalculateTrends(
                    activeQuotations, previousActiveQuotations,
                    delayedQuotations, previousDelayedQuotations,
                    teamEfficiency, previousTeamEfficiency)
            };
        }

        private decimal CalculateTeamEfficiency(List<Budget> budgets)
        {
            var totalBudgets = budgets.Count;
            if (totalBudgets == 0) return 0;

            var completedBudgets = budgets.Count(b =>
                DashboardConstants.Statuses.CompletedStatuses.Contains(b.status));

            Console.WriteLine($"DEBUG: Total budgets: {totalBudgets}, Completados: {completedBudgets}");

            // Redondear a 2 decimales
            return Math.Round((decimal)completedBudgets / totalBudgets * 100, 2);
        }

        private Dictionary<string, string> CalculateTrends(
            int currentActive, int previousActive,
            int currentDelayed, int previousDelayed,
            decimal currentEfficiency, decimal previousEfficiency)
        {
            // Calcular tendencias basadas en comparación con período anterior
            var activeTrend = currentActive > previousActive ? "up" :
                             currentActive < previousActive ? "down" : "stable";

            var delayedTrend = currentDelayed > previousDelayed ? "up" :
                              currentDelayed < previousDelayed ? "down" : "stable";

            // Para eficiencia, "up" significa mejora (número mayor)
            var efficiencyTrend = currentEfficiency > previousEfficiency ? "up" :
                                 currentEfficiency < previousEfficiency ? "down" : "stable";

            return new Dictionary<string, string>
            {
                { "activeQuotations", activeTrend },
                { "delayedQuotations", delayedTrend },
                { "teamEfficiency", efficiencyTrend }
            };
        }

        private (DateTime startDate, DateTime endDate) GetDateRange(string timeRange)
        {
            var endDate = DateTime.UtcNow;
            DateTime startDate = timeRange switch
            {
                DashboardConstants.TimeRanges.Last7Days => endDate.AddDays(-7),
                DashboardConstants.TimeRanges.Last30Days => endDate.AddDays(-30),
                DashboardConstants.TimeRanges.Last90Days => endDate.AddDays(-90),
                _ => endDate.AddDays(-30) // Default a 30 días
            };

            Console.WriteLine($"DEBUG: Rango de fechas - Desde: {startDate}, Hasta: {endDate}");
            return (startDate, endDate);
        }

        private (DateTime startDate, DateTime endDate) GetPreviousDateRange(string timeRange)
        {
            var (currentStart, currentEnd) = GetDateRange(timeRange);
            var duration = currentEnd - currentStart;

            var previousEnd = currentStart.AddDays(-1);
            var previousStart = previousEnd - duration;

            return (previousStart, previousEnd);
        }

        private DateTime GetComparisonDate(DateTime creationDate, DateTime periodEndDate)
        {
            // Para comparación histórica, usar la fecha fin del período en lugar de DateTime.UtcNow
            return creationDate > periodEndDate ? periodEndDate : DateTime.UtcNow;
        }

        private string NormalizeTimeRange(string timeRange)
        {
            // Normalizar diferentes formatos de timeRange
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