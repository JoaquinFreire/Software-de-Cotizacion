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
        public async Task<List<ProblematicQuotationDTO>> Handle(GetProblematicQuotationQuery request, CancellationToken cancellationToken)
        {
            // Normalizar el parámetro timeRange
            var normalizedTimeRange = NormalizeTimeRange(request.TimeRange);

            var (startDate, endDate) = GetDateRange(normalizedTimeRange);

            // ✅ USAR DATOS PRE-CARGADOS en lugar de llamar a servicios
            var allBudgets = request.DashboardData.AllBudgets;
            var allUsers = request.DashboardData.AllUsers;
            var allQuotations = request.DashboardData.AllQuotations;

            var filteredBudgets = allBudgets
                .Where(b => b.creationDate >= startDate && b.creationDate <= endDate)
                .ToList();

            // Agrupar por budgetId y tomar la versión más reciente
            var latestBudgets = filteredBudgets
                .GroupBy(b => b.budgetId)
                .Select(g => g.OrderByDescending(b => b.version).First())
                .ToList();

            // ✅ PRE-CARGAR diccionarios para búsquedas rápidas
            var quotationsDict = allQuotations.ToDictionary(q => q.Id.ToString(), q => q);
            var usersDict = allUsers.ToDictionary(u => u.id, u => u);

            var problematicBudgets = new List<ProblematicQuotationDTO>();

            foreach (var budget in latestBudgets)
            {
                if (!DashboardConstants.Statuses.ActiveStatuses.Contains(budget.status) ||
                    (DateTime.UtcNow - budget.creationDate).TotalDays <= DashboardConstants.Thresholds.DaysWithoutEditYellow)
                {
                    continue;
                }

                string assigneeName = "N/A";
                int assigneeId = 0;

                // ✅ BUSCAR EN DICCIONARIOS PRE-CARGADOS (MUCHO MÁS RÁPIDO)
                if (quotationsDict.TryGetValue(budget.budgetId, out var quotation) &&
                    usersDict.TryGetValue(quotation.UserId, out var user))
                {
                    assigneeName = $"{user.name} {user.lastName}";
                    assigneeId = user.id;
                }
                else
                {
                    // Fallback a MongoDB si no hay datos en SQL
                    assigneeName = $"{budget.user?.name} {budget.user?.lastName}";
                    assigneeId = 0;
                }

                // Obtener el precio total de forma segura
                decimal totalPrice = GetTotalPriceFromBudget(budget);

                var problematicQuotation = new ProblematicQuotationDTO
                {
                    QuotationId = budget.budgetId,
                    Assignee = assigneeName,
                    AssigneeId = assigneeId,
                    DaysWithoutEdit = (int)(DateTime.UtcNow - budget.creationDate).TotalDays,
                    VersionCount = budget.version,
                    CurrentStatus = budget.status.ToString(),
                    CreationDate = budget.creationDate,
                    LastEditDate = budget.creationDate,
                    TotalPrice = totalPrice,
                    CustomerName = $"{budget.customer?.name} {budget.customer?.lastname}",
                    WorkPlace = budget.workPlace?.name,
                    AlertLevel = GetAlertLevel((int)(DateTime.UtcNow - budget.creationDate).TotalDays, budget.version)
                };

                problematicBudgets.Add(problematicQuotation);
            }

            return problematicBudgets
                .OrderByDescending(q => q.DaysWithoutEdit)
                .ThenByDescending(q => q.VersionCount)
                .ToList();
        }

        // ✅ ELIMINAR métodos que hacían llamadas individuales a la BD
        // Ya no necesitamos GetQuotationFromSQL ni GetUserFromSQL

        private decimal GetTotalPriceFromBudget(Budget budget)
        {
            decimal totalPrice = 0;
            try
            {
                if (budget.Total != null)
                {
                    if (budget.Total.GetType().GetProperty("amount") != null)
                    {
                        var amountProperty = budget.Total.GetType().GetProperty("amount");
                        if (amountProperty != null)
                        {
                            var amountValue = amountProperty.GetValue(budget.Total);
                            if (amountValue != null)
                            {
                                totalPrice = Convert.ToDecimal(amountValue);
                            }
                        }
                    }
                    else if (budget.Total is decimal)
                    {
                        totalPrice = (decimal)budget.Total;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al obtener precio total para cotización {budget.budgetId}: {ex.Message}");
                totalPrice = 0;
            }
            return totalPrice;
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