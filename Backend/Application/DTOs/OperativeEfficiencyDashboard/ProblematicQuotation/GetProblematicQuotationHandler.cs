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
        private readonly QuotationServices _quotationServices;

        public GetProblematicQuotationHandler(
            BudgetServices budgetServices,
            UserServices userServices,
            QuotationServices quotationServices)
        {
            _budgetServices = budgetServices;
            _userServices = userServices;
            _quotationServices = quotationServices;
        }

        public async Task<List<ProblematicQuotationDTO>> Handle(GetProblematicQuotationQuery request, CancellationToken cancellationToken)
        {
            // Normalizar el parámetro timeRange
            var normalizedTimeRange = NormalizeTimeRange(request.TimeRange);

            var (startDate, endDate) = GetDateRange(normalizedTimeRange);

            var allBudgets = await _budgetServices.GetAllBudgetsAsync();

            var filteredBudgets = allBudgets
                .Where(b => b.creationDate >= startDate && b.creationDate <= endDate)
                .ToList();

            // Agrupar por budgetId y tomar la versión más reciente
            var latestBudgets = filteredBudgets
                .GroupBy(b => b.budgetId)
                .Select(g => g.OrderByDescending(b => b.version).First())
                .ToList();

            var problematicBudgets = new List<ProblematicQuotationDTO>();

            foreach (var budget in latestBudgets)
            {
                if (!DashboardConstants.Statuses.ActiveStatuses.Contains(budget.status) ||
                    (DateTime.UtcNow - budget.creationDate).TotalDays <= DashboardConstants.Thresholds.DaysWithoutEditYellow)
                {
                    continue;
                }

                // Obtener información de la cotización desde SQL usando el budgetId como Id
                var sqlQuotation = await GetQuotationFromSQL(budget.budgetId);

                string assigneeName = "N/A";
                int assigneeId = 0;

                // Priorizar información desde SQL
                if (sqlQuotation != null)
                {
                    // Obtener información del usuario desde SQL usando el UserId
                    var sqlUser = await GetUserFromSQL(sqlQuotation.UserId);

                    if (sqlUser != null)
                    {
                        assigneeName = $"{sqlUser.name} {sqlUser.lastName}";
                        assigneeId = sqlUser.id;
                    }
                    else
                    {
                        // Si no se encuentra el usuario en SQL, usar el UserId como referencia
                        assigneeName = $"Usuario ID: {sqlQuotation.UserId}";
                        assigneeId = sqlQuotation.UserId;
                    }
                }
                else
                {
                    // Fallback a MongoDB si no hay datos en SQL
                    assigneeName = $"{budget.user?.name} {budget.user?.lastName}";
                    assigneeId = 0; // No tenemos ID confiable desde MongoDB
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

        // Método para obtener cotización desde SQL usando budgetId como Id
        private async Task<Quotation> GetQuotationFromSQL(string budgetId)
        {
            try
            {
                // Convertir budgetId a int (ya que Quotation.Id es int)
                if (int.TryParse(budgetId, out int quotationId))
                {
                    var quotation = await _quotationServices.GetByIdAsync(quotationId);
                    return quotation;
                }
                else
                {
                    Console.WriteLine($"No se pudo convertir budgetId a int: {budgetId}");
                    return null;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al obtener cotización desde SQL para ID {budgetId}: {ex.Message}");
                return null;
            }
        }

        // Método para obtener usuario desde SQL
        private async Task<User> GetUserFromSQL(int userId)
        {
            try
            {
                // Obtener usuario desde SQL usando UserServices
                var user = await _userServices.GetByIdAsync(userId);
                return user;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al obtener usuario desde SQL para ID {userId}: {ex.Message}");
                return null;
            }
        }

        private decimal GetTotalPriceFromBudget(Budget budget)
        {
            decimal totalPrice = 0;
            try
            {
                if (budget.Total != null)
                {
                    // Si total es un objeto con propiedad amount
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
                    // Si total es directamente un decimal
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