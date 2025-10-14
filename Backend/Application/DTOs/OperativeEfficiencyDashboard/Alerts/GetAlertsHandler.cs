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
        private readonly QuotationServices _quotationServices;

        public GetAlertsHandler(
            BudgetServices budgetServices,
            UserServices userServices,
            QuotationServices quotationServices)
        {
            _budgetServices = budgetServices;
            _userServices = userServices;
            _quotationServices = quotationServices;
        }

        public async Task<List<AlertDTO>> Handle(GetAlertsQuery request, CancellationToken cancellationToken)
        {
            var normalizedTimeRange = NormalizeTimeRange(request.TimeRange);
            var normalizedLevel = NormalizeLevel(request.Level);
            var (startDate, endDate) = GetDateRange(normalizedTimeRange);

            // Obtener datos básicos
            var allUsers = await _userServices.GetAllAsync();
            var allBudgets = await _budgetServices.GetAllBudgetsAsync();
            var allQuotations = await _quotationServices.GetAllAsync();

            // Filtrar por fecha
            var filteredBudgets = allBudgets
                .Where(b => b.creationDate >= startDate && b.creationDate <= endDate)
                .ToList();

            var filteredQuotations = allQuotations
                .Where(q => q.CreationDate >= startDate && q.CreationDate <= endDate)
                .ToList();

            // Ejecutar alertas en paralelo
            var alertTasks = new List<Task<List<AlertDTO>>>
            {
                GetOverloadAlerts(allUsers, filteredBudgets, filteredQuotations),
                GetInactivityAlerts(allUsers, filteredBudgets, filteredQuotations),
                GetEfficiencyAlerts(allUsers, filteredBudgets, filteredQuotations),
                GetTrendAlerts(allUsers, filteredBudgets, filteredQuotations, startDate, endDate),
                GetPriorityAlerts(allUsers, filteredBudgets, filteredQuotations),
                GetCoordinationAlerts(allUsers, filteredBudgets, filteredQuotations)
            };

            var alertResults = await Task.WhenAll(alertTasks);
            var alerts = alertResults.SelectMany(x => x).ToList();

            // Aplicar filtros y ordenamiento
            if (!string.IsNullOrEmpty(normalizedLevel) && normalizedLevel != "all")
            {
                alerts = alerts.Where(a => a.Level == normalizedLevel).ToList();
            }

            return alerts
                .GroupBy(a => new { a.Type, a.QuotationId, a.Assignee, a.Level })
                .Select(g => g.First())
                .OrderByDescending(a => a.Level == "red")
                .ThenByDescending(a => a.Level == "yellow")
                .ThenBy(a => a.Time)
                .ToList();
        }

        #region Métodos Principales de Alertas

        private async Task<List<AlertDTO>> GetOverloadAlerts(
            IEnumerable<User> allUsers,
            IEnumerable<Budget> filteredBudgets,
            IEnumerable<Quotation> filteredQuotations)
        {
            var alerts = new List<AlertDTO>();
            var quoters = allUsers.Where(u => u.role?.role_name == "quotator").ToList();

            foreach (var quoter in quoters)
            {
                var userQuotationIds = filteredQuotations
                    .Where(q => q.UserId == quoter.id)
                    .Select(q => q.Id.ToString())
                    .ToList();

                var activeCount = filteredBudgets
                    .Count(b => userQuotationIds.Contains(b.budgetId) &&
                               DashboardConstants.Statuses.ActiveStatuses.Contains(b.status));

                if (activeCount >= DashboardConstants.Thresholds.ActiveQuotationsRed)
                {
                    alerts.Add(CreateAlert(
                        level: "red",
                        title: "Sobrecarga crítica",
                        description: $"{quoter.name} {quoter.lastName} tiene {activeCount} cotizaciones activas (límite: {DashboardConstants.Thresholds.ActiveQuotationsRed})",
                        type: "workload",
                        assignee: $"{quoter.name} {quoter.lastName}",
                        assigneeId: quoter.id,
                        metricValue: activeCount
                    ));
                }
                else if (activeCount >= DashboardConstants.Thresholds.ActiveQuotationsYellow)
                {
                    alerts.Add(CreateAlert(
                        level: "yellow",
                        title: "Carga de trabajo alta",
                        description: $"{quoter.name} {quoter.lastName} tiene {activeCount} cotizaciones activas (límite: {DashboardConstants.Thresholds.ActiveQuotationsYellow})",
                        type: "workload",
                        assignee: $"{quoter.name} {quoter.lastName}",
                        assigneeId: quoter.id,
                        metricValue: activeCount
                    ));
                }
            }

            return alerts;
        }

        private async Task<List<AlertDTO>> GetInactivityAlerts(
            IEnumerable<User> allUsers,
            IEnumerable<Budget> filteredBudgets,
            IEnumerable<Quotation> filteredQuotations)
        {
            var alerts = new List<AlertDTO>();

            var inactiveBudgets = filteredBudgets
                .Where(b => DashboardConstants.Statuses.ActiveStatuses.Contains(b.status) &&
                           (DateTime.UtcNow - b.creationDate).TotalDays > DashboardConstants.Thresholds.DaysWithoutEditYellow)
                .ToList();

            // Pre-calcular mapeo de quotationId a usuario
            var quotationToUserMap = filteredQuotations
                .ToDictionary(q => q.Id.ToString(), q => q.UserId);

            foreach (var budget in inactiveBudgets)
            {
                var daysWithoutEdit = (int)(DateTime.UtcNow - budget.creationDate).TotalDays;
                var level = daysWithoutEdit >= DashboardConstants.Thresholds.DaysWithoutEditRed ? "red" : "yellow";

                string assigneeName = "N/A";
                int assigneeId = 0;

                if (quotationToUserMap.TryGetValue(budget.budgetId, out int userId))
                {
                    var user = allUsers.FirstOrDefault(u => u.id == userId);
                    if (user != null)
                    {
                        assigneeName = $"{user.name} {user.lastName}";
                        assigneeId = user.id;
                    }
                }
                else
                {
                    // Fallback a datos del budget
                    assigneeName = $"{budget.user?.name} {budget.user?.lastName}";
                }

                alerts.Add(CreateAlert(
                    level: level,
                    title: daysWithoutEdit >= DashboardConstants.Thresholds.DaysWithoutEditRed ?
                           "Inactividad crítica" : "Inactividad prolongada",
                    description: $"Cotización #{budget.budgetId} - {daysWithoutEdit} días sin actualización",
                    type: "inactivity",
                    quotationId: budget.budgetId,
                    assignee: assigneeName,
                    assigneeId: assigneeId,
                    daysWithoutEdit: daysWithoutEdit,
                    metricValue: daysWithoutEdit
                ));
            }

            return alerts;
        }

        private async Task<List<AlertDTO>> GetEfficiencyAlerts(
            IEnumerable<User> allUsers,
            IEnumerable<Budget> filteredBudgets,
            IEnumerable<Quotation> filteredQuotations)
        {
            var alerts = new List<AlertDTO>();
            var quoters = allUsers.Where(u => u.role?.role_name == "quotator").ToList();

            // Pre-calcular cotizaciones por usuario
            var userQuotationMap = filteredQuotations
                .GroupBy(q => q.UserId)
                .ToDictionary(g => g.Key, g => g.Select(q => q.Id.ToString()).ToList());

            foreach (var quoter in quoters)
            {
                if (!userQuotationMap.TryGetValue(quoter.id, out var userQuotationIds) || !userQuotationIds.Any())
                    continue;

                var userBudgets = filteredBudgets
                    .Where(b => userQuotationIds.Contains(b.budgetId))
                    .ToList();

                var efficiency = CalculateUserEfficiency(userBudgets);

                if (efficiency <= DashboardConstants.Thresholds.EfficiencyRed)
                {
                    alerts.Add(CreateAlert(
                        level: "red",
                        title: "Eficiencia crítica",
                        description: $"{quoter.name} {quoter.lastName} tiene {efficiency:F2}% de eficiencia (mínimo: {DashboardConstants.Thresholds.EfficiencyRed}%)",
                        type: "efficiency",
                        assignee: $"{quoter.name} {quoter.lastName}",
                        assigneeId: quoter.id,
                        metricValue: efficiency
                    ));
                }
                else if (efficiency <= DashboardConstants.Thresholds.EfficiencyYellow)
                {
                    alerts.Add(CreateAlert(
                        level: "yellow",
                        title: "Eficiencia baja",
                        description: $"{quoter.name} {quoter.lastName} tiene {efficiency:F2}% de eficiencia (mínimo: {DashboardConstants.Thresholds.EfficiencyYellow}%)",
                        type: "efficiency",
                        assignee: $"{quoter.name} {quoter.lastName}",
                        assigneeId: quoter.id,
                        metricValue: efficiency
                    ));
                }
            }

            return alerts;
        }

        private async Task<List<AlertDTO>> GetTrendAlerts(
            IEnumerable<User> allUsers,
            IEnumerable<Budget> filteredBudgets,
            IEnumerable<Quotation> filteredQuotations,
            DateTime startDate,
            DateTime endDate)
        {
            var alerts = new List<AlertDTO>();
            var quoters = allUsers.Where(u => u.role?.role_name == "quotator").ToList();

            // Para tendencias necesitamos datos del período anterior
            var previousStartDate = startDate.AddDays(-(endDate - startDate).Days);
            var previousEndDate = startDate;

            var allBudgetsForTrends = await _budgetServices.GetAllBudgetsAsync();
            var allQuotationsForTrends = await _quotationServices.GetAllAsync();

            var previousBudgets = allBudgetsForTrends
                .Where(b => b.creationDate >= previousStartDate && b.creationDate <= previousEndDate)
                .ToList();

            var previousQuotations = allQuotationsForTrends
                .Where(q => q.CreationDate >= previousStartDate && q.CreationDate <= previousEndDate)
                .ToList();

            foreach (var quoter in quoters)
            {
                var currentWorkload = await GetUserWorkload(quoter.id, filteredBudgets, filteredQuotations);
                var previousWorkload = await GetUserWorkload(quoter.id, previousBudgets, previousQuotations);

                // 1. Alerta por aumento repentino de carga
                if (previousWorkload.ActiveCount > 0 &&
                    currentWorkload.ActiveCount > previousWorkload.ActiveCount * 1.5)
                {
                    alerts.Add(CreateAlert(
                        level: "yellow",
                        title: "Aumento repentino de carga",
                        description: $"{quoter.name} aumentó su carga de {previousWorkload.ActiveCount} a {currentWorkload.ActiveCount} cotizaciones activas",
                        type: "trend_workload",
                        assignee: $"{quoter.name} {quoter.lastName}",
                        assigneeId: quoter.id,
                        metricValue: currentWorkload.ActiveCount
                    ));
                }

                // 2. Alerta por caída de eficiencia
                if (previousWorkload.Efficiency > 0 &&
                    currentWorkload.Efficiency < previousWorkload.Efficiency - 15)
                {
                    alerts.Add(CreateAlert(
                        level: "yellow",
                        title: "Caída en eficiencia",
                        description: $"{quoter.name} bajó su eficiencia de {previousWorkload.Efficiency:F1}% a {currentWorkload.Efficiency:F1}%",
                        type: "trend_efficiency",
                        assignee: $"{quoter.name} {quoter.lastName}",
                        assigneeId: quoter.id,
                        metricValue: currentWorkload.Efficiency
                    ));
                }

                // 3. Alerta por patrones de demora
                var delayPattern = await GetDelayPattern(quoter.id, filteredBudgets, filteredQuotations);
                if (delayPattern.IsConcerning)
                {
                    alerts.Add(CreateAlert(
                        level: delayPattern.Level,
                        title: "Patrón de demoras detectado",
                        description: $"{quoter.name} tiene {delayPattern.DelayedCount} cotizaciones con demora de {delayPattern.AverageDelayDays} días en promedio",
                        type: "pattern_delay",
                        assignee: $"{quoter.name} {quoter.lastName}",
                        assigneeId: quoter.id,
                        metricValue: (decimal)delayPattern.AverageDelayDays
                    ));
                }
            }

            return alerts;
        }

        private async Task<List<AlertDTO>> GetPriorityAlerts(
            IEnumerable<User> allUsers,
            IEnumerable<Budget> filteredBudgets,
            IEnumerable<Quotation> filteredQuotations)
        {
            var alerts = new List<AlertDTO>();

            // 1. Clientes recurrentes con cotizaciones estancadas
            var recurringCustomers = filteredBudgets
                .GroupBy(b => b.customer?.dni)
                .Where(g => g.Count() >= 3)
                .Select(g => new { Customer = g.First().customer, Count = g.Count() })
                .ToList();

            foreach (var customer in recurringCustomers)
            {
                var delayedBudgets = filteredBudgets
                    .Where(b => b.customer?.dni == customer.Customer?.dni &&
                               DashboardConstants.Statuses.ActiveStatuses.Contains(b.status) &&
                               (DateTime.UtcNow - b.creationDate).TotalDays > 15)
                    .ToList();

                if (delayedBudgets.Any())
                {
                    alerts.Add(CreateAlert(
                        level: "yellow",
                        title: "Cliente recuriente con demoras",
                        description: $"{customer.Customer?.name} ({customer.Count} cotizaciones) tiene {delayedBudgets.Count} cotizaciones con más de 15 días",
                        type: "priority_customer",
                        assignee: "Equipo Comercial",
                        assigneeId: 0,
                        metricValue: delayedBudgets.Count
                    ));
                }
            }

            // 2. Cotizaciones de alto valor estancadas
            var highValueBudgets = filteredBudgets
                .Where(b => GetTotalPriceFromBudget(b) > 100000 && // +$100,000
                           DashboardConstants.Statuses.ActiveStatuses.Contains(b.status) &&
                           (DateTime.UtcNow - b.creationDate).TotalDays > 10)
                .ToList();

            var quotationToUserMap = filteredQuotations
                .ToDictionary(q => q.Id.ToString(), q => q.UserId);

            foreach (var budget in highValueBudgets)
            {
                string assigneeName = "N/A";
                int assigneeId = 0;

                if (quotationToUserMap.TryGetValue(budget.budgetId, out int userId))
                {
                    var user = allUsers.FirstOrDefault(u => u.id == userId);
                    if (user != null)
                    {
                        assigneeName = $"{user.name} {user.lastName}";
                        assigneeId = user.id;
                    }
                }

                alerts.Add(CreateAlert(
                    level: "red",
                    title: "Alto valor en riesgo",
                    description: $"Cotización #{budget.budgetId} (${GetTotalPriceFromBudget(budget):N0}) lleva 10+ días sin avance",
                    type: "high_value",
                    quotationId: budget.budgetId,
                    assignee: assigneeName,
                    assigneeId: assigneeId,
                    metricValue: GetTotalPriceFromBudget(budget)
                ));
            }

            return alerts;
        }

        private async Task<List<AlertDTO>> GetCoordinationAlerts(
            IEnumerable<User> allUsers,
            IEnumerable<Budget> filteredBudgets,
            IEnumerable<Quotation> filteredQuotations)
        {
            var alerts = new List<AlertDTO>();

            // 1. Distribución desigual de carga
            var workloadDistribution = await GetWorkloadDistribution(allUsers, filteredBudgets, filteredQuotations);

            if (workloadDistribution.Any())
            {
                var averageWorkload = workloadDistribution.Average(w => w.ActiveCount);
                var unbalancedUsers = workloadDistribution.Where(w => w.ActiveCount > averageWorkload * 1.8);

                foreach (var userWorkload in unbalancedUsers)
                {
                    alerts.Add(CreateAlert(
                        level: "yellow",
                        title: "Carga desbalanceada",
                        description: $"{userWorkload.UserName} tiene {userWorkload.ActiveCount} cotizaciones (promedio: {averageWorkload:F1})",
                        type: "coordination_balance",
                        assignee: "Coordinador",
                        assigneeId: 0,
                        metricValue: userWorkload.ActiveCount
                    ));
                }

                // 2. Usuarios próximos a límite de capacidad
                var nearCapacityUsers = workloadDistribution.Where(w =>
                    w.ActiveCount >= DashboardConstants.Thresholds.ActiveQuotationsYellow * 0.8);

                foreach (var userWorkload in nearCapacityUsers)
                {
                    alerts.Add(CreateAlert(
                        level: "yellow",
                        title: "Capacidad próxima al límite",
                        description: $"{userWorkload.UserName} está al {((decimal)userWorkload.ActiveCount / DashboardConstants.Thresholds.ActiveQuotationsYellow * 100):F0}% de su capacidad",
                        type: "coordination_capacity",
                        assignee: "Coordinador",
                        assigneeId: 0,
                        metricValue: userWorkload.ActiveCount
                    ));
                }
            }

            return alerts;
        }

        #endregion

        #region Métodos Auxiliares

        private async Task<(int ActiveCount, decimal Efficiency)> GetUserWorkload(
            int userId,
            IEnumerable<Budget> budgets,
            IEnumerable<Quotation> quotations)
        {
            var userQuotationIds = quotations
                .Where(q => q.UserId == userId)
                .Select(q => q.Id.ToString())
                .ToList();

            var userBudgets = budgets
                .Where(b => userQuotationIds.Contains(b.budgetId))
                .ToList();

            var activeCount = userBudgets
                .Count(b => DashboardConstants.Statuses.ActiveStatuses.Contains(b.status));

            var efficiency = CalculateUserEfficiency(userBudgets);

            return (activeCount, efficiency);
        }

        private async Task<(bool IsConcerning, string Level, int DelayedCount, double AverageDelayDays)> GetDelayPattern(
            int userId,
            IEnumerable<Budget> budgets,
            IEnumerable<Quotation> quotations)
        {
            var userQuotationIds = quotations
                .Where(q => q.UserId == userId)
                .Select(q => q.Id.ToString())
                .ToList();

            var userBudgets = budgets
                .Where(b => userQuotationIds.Contains(b.budgetId) &&
                           DashboardConstants.Statuses.ActiveStatuses.Contains(b.status))
                .ToList();

            var delayedBudgets = userBudgets
                .Where(b => (DateTime.UtcNow - b.creationDate).TotalDays > DashboardConstants.Thresholds.DaysWithoutEditYellow)
                .ToList();

            if (!delayedBudgets.Any())
                return (false, "green", 0, 0);

            var averageDelay = delayedBudgets.Average(b => (DateTime.UtcNow - b.creationDate).TotalDays);
            var delayedCount = delayedBudgets.Count;
            var totalBudgets = userBudgets.Count;

            var delayPercentage = (double)delayedCount / totalBudgets * 100;

            string level;
            if (delayPercentage > 30 || averageDelay > DashboardConstants.Thresholds.DaysWithoutEditRed)
                level = "red";
            else if (delayPercentage > 15 || averageDelay > DashboardConstants.Thresholds.DaysWithoutEditYellow)
                level = "yellow";
            else
                level = "green";

            return (level != "green", level, delayedCount, Math.Round(averageDelay, 1));
        }

        private decimal GetTotalPriceFromBudget(Budget budget)
        {
            return budget.Total;
        }

        private async Task<List<(string UserName, int ActiveCount)>> GetWorkloadDistribution(
            IEnumerable<User> allUsers,
            IEnumerable<Budget> budgets,
            IEnumerable<Quotation> quotations)
        {
            var quoters = allUsers.Where(u => u.role?.role_name == "quotator").ToList();
            var distribution = new List<(string, int)>();

            foreach (var quoter in quoters)
            {
                var workload = await GetUserWorkload(quoter.id, budgets, quotations);
                distribution.Add(($"{quoter.name} {quoter.lastName}", workload.ActiveCount));
            }

            return distribution;
        }

        private decimal CalculateUserEfficiency(List<Budget> userBudgets)
        {
            var totalBudgets = userBudgets.Count;
            if (totalBudgets == 0) return 0;

            var completedBudgets = userBudgets.Count(b =>
                DashboardConstants.Statuses.CompletedStatuses.Contains(b.status));

            return Math.Round((decimal)completedBudgets / totalBudgets * 100, 2);
        }

        private AlertDTO CreateAlert(
            string level,
            string title,
            string description,
            string type,
            string assignee,
            int assigneeId,
            string? quotationId = null,
            int? daysWithoutEdit = null,
            decimal? metricValue = null)
        {
            return new AlertDTO
            {
                Level = level,
                Title = title,
                Description = description,
                Time = DateTime.UtcNow,
                Type = type,
                QuotationId = quotationId,
                Assignee = assignee,
                AssigneeId = assigneeId,
                DaysWithoutEdit = daysWithoutEdit,
                MetricValue = metricValue
            };
        }

        #endregion

        #region Helpers

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

        #endregion
    }
}