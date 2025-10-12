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

        public GetWorkloadHandler(
            BudgetServices budgetServices,
            UserServices userServices)
        {
            _budgetServices = budgetServices;
            _userServices = userServices;
        }

        public async Task<List<WorkloadDTO>> Handle(GetWorkloadQuery request, CancellationToken cancellationToken)
        {
            // Normalizar el parámetro timeRange
            var normalizedTimeRange = NormalizeTimeRange(request.TimeRange);

            var (startDate, endDate) = GetDateRange(normalizedTimeRange);

            var allUsers = await _userServices.GetAllAsync();

            // FILTRO MODIFICADO: Solo usuarios activos (status = 1) y con roles de cotización
            var quoters = allUsers.Where(u =>
                u.status == 1 && // Solo usuarios activos
                (u.role?.role_name == "quotator" || u.role?.role_name == "coordinator" || u.role?.role_name == "manager")
            ).ToList();

            var allBudgets = await _budgetServices.GetAllBudgetsAsync();
            var allBudgetsList = allBudgets.ToList();
            var filteredBudgets = allBudgetsList
                .Where(b => b.creationDate >= startDate && b.creationDate <= endDate)
                .ToList();

            Console.WriteLine($"DEBUG WORKLOAD: Total budgets: {allBudgetsList.Count}, En período: {filteredBudgets.Count}");
            Console.WriteLine($"DEBUG WORKLOAD: Usuarios cotizadores ACTIVOS: {quoters.Count}");

            var workloadData = new List<WorkloadDTO>();

            foreach (var quoter in quoters)
            {
                var userBudgets = FindUserBudgets(filteredBudgets, quoter);

                var activeQuotations = userBudgets.Count(b =>
                    DashboardConstants.Statuses.ActiveStatuses.Contains(b.status));

                var pendingQuotations = userBudgets.Count(b =>
                    b.status == BudgetStatus.Pending);

                var delayedQuotations = userBudgets.Count(b =>
                    DashboardConstants.Statuses.ActiveStatuses.Contains(b.status) &&
                    (DateTime.UtcNow - b.creationDate).TotalDays > DashboardConstants.Thresholds.DaysWithoutEditYellow);

                var efficiency = CalculateUserEfficiency(userBudgets);
                var alerts = CalculateUserAlerts(activeQuotations, delayedQuotations, efficiency, userBudgets.Count);

                Console.WriteLine($"DEBUG USER: {quoter.name} - Status: {quoter.status}, Budgets: {userBudgets.Count}, Activas: {activeQuotations}, Eficiencia: {efficiency}%");

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

            // Ordenar por número de cotizaciones activas (descendente)
            return workloadData.OrderByDescending(w => w.ActiveQuotations).ToList();
        }

        // Los demás métodos permanecen igual...
        private List<Budget> FindUserBudgets(List<Budget> budgets, User quoter)
        {
            return budgets.Where(b =>
                // Comparar por email (más confiable)
                b.user?.mail?.Equals(quoter.mail, StringComparison.OrdinalIgnoreCase) == true ||
                // Comparar por nombre completo (backup)
                ($"{b.user?.name} {b.user?.lastName}".Trim().Equals($"{quoter.name} {quoter.lastName}".Trim(), StringComparison.OrdinalIgnoreCase)) ||
                // Comparar solo por ID si está disponible
                (b.user?.id != null && b.user.id == quoter.id)
            ).ToList();
        }

        private decimal CalculateUserEfficiency(List<Budget> userBudgets)
        {
            var totalBudgets = userBudgets.Count;
            if (totalBudgets == 0) return -1; // -1 indica "sin datos"

            var completedBudgets = userBudgets.Count(b =>
                DashboardConstants.Statuses.CompletedStatuses.Contains(b.status));

            // Redondear a 2 decimales
            return Math.Round((decimal)completedBudgets / totalBudgets * 100, 2);
        }

        private WorkloadAlertsDTO CalculateUserAlerts(int activeQuotations, int delayedQuotations, decimal efficiency, int totalBudgets)
        {
            var alerts = new WorkloadAlertsDTO();

            // Si no hay cotizaciones, mostrar estado neutral
            if (totalBudgets == 0 || efficiency == -1)
            {
                alerts.Active = "gray";
                alerts.Delayed = "gray";
                alerts.Overall = "gray";
                return alerts;
            }

            // Alertas para cotizaciones activas
            alerts.Active = activeQuotations >= DashboardConstants.Thresholds.ActiveQuotationsRed ? "red" :
                           activeQuotations >= DashboardConstants.Thresholds.ActiveQuotationsYellow ? "yellow" : "green";

            // Alertas para cotizaciones retrasadas
            alerts.Delayed = delayedQuotations >= DashboardConstants.Thresholds.DaysWithoutEditRed ? "red" :
                            delayedQuotations >= DashboardConstants.Thresholds.DaysWithoutEditYellow ? "yellow" : "green";

            // Alertas para eficiencia general
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
                _ => endDate.AddDays(-30) // Default a 30 días
            };
            return (startDate, endDate);
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