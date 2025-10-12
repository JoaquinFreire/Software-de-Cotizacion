using Application.DTOs.OperativeEfficiencyDashboard.Constants;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using System.Linq;

namespace Application.DTOs.OperativeEfficiencyDashboard.ProblematicQuotation
{
    public class GetProblematicQuotationHandler : IRequestHandler<GetProblematicQuotationQuery, List<ProblematicQuotationDTO>>
    {
        private readonly BudgetServices _budgetServices;
        private readonly UserServices _userServices;

        public GetProblematicQuotationHandler(
            BudgetServices budgetServices,
            UserServices userServices)
        {
            _budgetServices = budgetServices;
            _userServices = userServices;
        }

        public async Task<List<ProblematicQuotationDTO>> Handle(GetProblematicQuotationQuery request, CancellationToken cancellationToken)
        {
            // Normalizar el parámetro timeRange
            var normalizedTimeRange = NormalizeTimeRange(request.TimeRange);

            var (startDate, endDate) = GetDateRange(normalizedTimeRange);

            var allBudgets = await _budgetServices.GetAllBudgetsAsync();
            var allUsers = await _userServices.GetAllAsync();

            var filteredBudgets = allBudgets
                .Where(b => b.creationDate >= startDate && b.creationDate <= endDate)
                .ToList();

            // Agrupar por budgetId y tomar la versión más reciente
            var latestBudgets = filteredBudgets
                .GroupBy(b => b.budgetId)
                .Select(g => g.OrderByDescending(b => b.version).First())
                .ToList();

            var problematicBudgets = latestBudgets
                .Where(b => DashboardConstants.Statuses.ActiveStatuses.Contains(b.status))
                .Where(b => (DateTime.UtcNow - b.creationDate).TotalDays > DashboardConstants.Thresholds.DaysWithoutEditYellow)
                .Select(b =>
                {
                    // Buscar el usuario real en SQL para obtener el ID correcto
                    var user = allUsers.FirstOrDefault(u =>
                        u.mail?.Equals(b.user?.mail, StringComparison.OrdinalIgnoreCase) == true ||
                        ($"{u.name} {u.lastName}".Trim().Equals($"{b.user?.name} {b.user?.lastName}".Trim(), StringComparison.OrdinalIgnoreCase)));

                    // Obtener el precio total de forma segura
                    decimal totalPrice = 0;
                    try
                    {
                        // Según tu estructura de MongoDB, el total puede estar en diferentes formatos
                        if (b.Total != null)
                        {
                            // Si total es un objeto con propiedad amount
                            if (b.Total.GetType().GetProperty("amount") != null)
                            {
                                var amountProperty = b.Total.GetType().GetProperty("amount");
                                if (amountProperty != null)
                                {
                                    var amountValue = amountProperty.GetValue(b.Total);
                                    if (amountValue != null)
                                    {
                                        totalPrice = Convert.ToDecimal(amountValue);
                                    }
                                }
                            }
                            // Si total es directamente un decimal
                            else if (b.Total is decimal)
                            {
                                totalPrice = (decimal)b.Total;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error al obtener precio total para cotización {b.budgetId}: {ex.Message}");
                        totalPrice = 0;
                    }

                    return new ProblematicQuotationDTO
                    {
                        QuotationId = b.budgetId,
                        Assignee = $"{b.user?.name} {b.user?.lastName}",
                        AssigneeId = user?.id ?? 0, // Usar el ID real del usuario
                        DaysWithoutEdit = (int)(DateTime.UtcNow - b.creationDate).TotalDays,
                        VersionCount = b.version,
                        CurrentStatus = b.status.ToString(),
                        CreationDate = b.creationDate,
                        LastEditDate = b.creationDate, // Por ahora usar creationDate
                        TotalPrice = totalPrice,
                        CustomerName = $"{b.customer?.name} {b.customer?.lastname}",
                        WorkPlace = b.workPlace?.name,
                        AlertLevel = GetAlertLevel((int)(DateTime.UtcNow - b.creationDate).TotalDays, b.version)
                    };
                })
                .OrderByDescending(q => q.DaysWithoutEdit)
                .ThenByDescending(q => q.VersionCount)
                .ToList();

            return problematicBudgets;
        }

        private string GetAlertLevel(int daysWithoutEdit, int versionCount)
        {
            if (daysWithoutEdit >= DashboardConstants.Thresholds.DaysWithoutEditRed ||
                versionCount >= DashboardConstants.Thresholds.VersionCountRed)
                return "red";

            if (daysWithoutEdit >= DashboardConstants.Thresholds.DaysWithoutEditYellow ||
                versionCount >= DashboardConstants.Thresholds.VersionCountYellow)
                return "yellow";

            return "green";
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