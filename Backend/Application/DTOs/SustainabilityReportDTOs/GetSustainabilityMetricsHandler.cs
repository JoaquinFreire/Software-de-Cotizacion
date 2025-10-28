using Domain.Entities;
using Domain.Enums;
using Domain.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;
using static Domain.Repositories.IBudgetRepository;

namespace Application.DTOs.SustainabilityReportDTOs
{
    public class GetSustainabilityMetricsHandler : IRequestHandler<GetSustainabilityMetricsQuery, SustainabilityMetricsDTO>
    {
        private readonly IQuotationRepository _quotationRepository;
        private readonly IBudgetRepository _budgetRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<GetSustainabilityMetricsHandler> _logger;

        public GetSustainabilityMetricsHandler(
            IQuotationRepository quotationRepository,
            IBudgetRepository budgetRepository,
            ICustomerRepository customerRepository,
            IUserRepository userRepository,
            ILogger<GetSustainabilityMetricsHandler> logger)
        {
            _quotationRepository = quotationRepository;
            _budgetRepository = budgetRepository;
            _customerRepository = customerRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<SustainabilityMetricsDTO> Handle(GetSustainabilityMetricsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Calculando métricas de sostenibilidad...");

                // Determinar fechas por defecto
                var (fromDate, toDate) = CalculateDateRange(request);

                // Obtener datos usando los nuevos métodos
                var approvedBudgets = await _budgetRepository.GetApprovedBudgetsInPeriodAsync(fromDate, toDate);
                var allBudgets = await _budgetRepository.GetAllBudgetsInPeriodAsync(fromDate, toDate);
                var pendingQuotations = await _quotationRepository.GetPendingQuotationsAsync();

                // Construir el DTO
                return new SustainabilityMetricsDTO
                {
                    TotalRevenue = CalculateTotalRevenue(approvedBudgets),
                    GrowthRate = await CalculateGrowthRate(fromDate, toDate),
                    AverageTicket = CalculateAverageTicket(approvedBudgets),
                    MonthlyTrends = await CalculateMonthlyTrends(fromDate, toDate),
                    ProductMix = CalculateProductMix(approvedBudgets),
                    ClientConcentration = await CalculateClientConcentration(approvedBudgets),
                    RevenueForecast = await CalculateRevenueForecast(pendingQuotations),
                    BusinessHealth = await CalculateBusinessHealth(approvedBudgets, allBudgets, fromDate, toDate)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculando métricas de sostenibilidad");
                throw;
            }
        }

        private (DateTime fromDate, DateTime toDate) CalculateDateRange(GetSustainabilityMetricsQuery request)
        {
            var toDate = request.ToDate ?? DateTime.UtcNow;
            var fromDate = request.FromDate ?? request.TimeRange?.ToLower() switch
            {
                "1m" => toDate.AddMonths(-1),
                "3m" => toDate.AddMonths(-3),
                "6m" => toDate.AddMonths(-6),
                _ => toDate.AddMonths(-12) // Default: 12 meses
            };
            return (fromDate, toDate);
        }

        private decimal CalculateTotalRevenue(List<Budget> approvedBudgets)
        {
            return approvedBudgets.Sum(b => b.Total);
        }

        private async Task<decimal> CalculateGrowthRate(DateTime fromDate, DateTime toDate)
        {
            var currentRevenue = await _budgetRepository.GetTotalRevenueInPeriodAsync(fromDate, toDate);

            // Calcular período anterior (misma duración)
            var periodDays = (toDate - fromDate).Days;
            var previousToDate = fromDate.AddDays(-1);
            var previousFromDate = previousToDate.AddDays(-periodDays);

            var previousRevenue = await _budgetRepository.GetTotalRevenueInPeriodAsync(previousFromDate, previousToDate);

            if (previousRevenue == 0) return 0;
            return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        }

        private decimal CalculateAverageTicket(List<Budget> approvedBudgets)
        {
            if (!approvedBudgets.Any()) return 0;
            return approvedBudgets.Average(b => b.Total);
        }

        private async Task<List<MonthlyRevenueDTO>> CalculateMonthlyTrends(DateTime fromDate, DateTime toDate)
        {
            var monthlyData = await _budgetRepository.GetMonthlyRevenueAsync(fromDate, toDate);

            // Calcular datos del año anterior
            var previousFromDate = fromDate.AddYears(-1);
            var previousToDate = toDate.AddYears(-1);
            var previousYearData = await _budgetRepository.GetMonthlyRevenueAsync(previousFromDate, previousToDate);

            return monthlyData.Select(current => new MonthlyRevenueDTO
            {
                Month = $"{current.Month:00}/{current.Year}",
                Revenue = current.Revenue,
                PreviousYearRevenue = previousYearData
                    .FirstOrDefault(p => p.Month == current.Month && p.Year == current.Year)
                    ?.Revenue ?? 0,
                GrowthRate = CalculateMonthlyGrowth(current, previousYearData)
            }).ToList();
        }

        private decimal CalculateMonthlyGrowth(MonthlyRevenue current, List<MonthlyRevenue> previousYearData)
        {
            var previous = previousYearData.FirstOrDefault(p => p.Month == current.Month && p.Year == current.Year);
            if (previous?.Revenue == 0 || previous == null) return 0;
            return ((current.Revenue - previous.Revenue) / previous.Revenue) * 100;
        }

        private List<ProductRevenueDTO> CalculateProductMix(List<Budget> approvedBudgets)
        {
            var totalRevenue = approvedBudgets.Sum(b => b.Total);
            var productRevenue = approvedBudgets
                .SelectMany(b => b.Products)
                .Where(p => p.OpeningType != null) // Filtrar productos nulos
                .GroupBy(p => p.OpeningType.name)
                .Select(g => new ProductRevenueDTO
                {
                    ProductName = g.Key,
                    Revenue = g.Sum(p => (p.price ?? 0) * p.Quantity),
                    Percentage = totalRevenue > 0 ? (g.Sum(p => (p.price ?? 0) * p.Quantity) / totalRevenue) * 100 : 0
                })
                .OrderByDescending(p => p.Revenue)
                .ToList();

            return productRevenue;
        }

        private async Task<List<ClientConcentrationDTO>> CalculateClientConcentration(List<Budget> approvedBudgets)
        {
            var totalRevenue = approvedBudgets.Sum(b => b.Total);
            var clientRevenue = approvedBudgets
                .GroupBy(b => b.customer.dni) // Agrupar por DNI para evitar duplicados
                .Select(g => new
                {
                    Customer = g.First().customer,
                    Revenue = g.Sum(b => b.Total)
                })
                .Select(x => new ClientConcentrationDTO
                {
                    ClientName = $"{x.Customer.name} {x.Customer.lastname}",
                    Revenue = x.Revenue,
                    Percentage = totalRevenue > 0 ? (x.Revenue / totalRevenue) * 100 : 0,
                    RiskLevel = CalculateRiskLevel(x.Revenue, totalRevenue)
                })
                .OrderByDescending(c => c.Revenue)
                .Take(10) // Top 10 clientes
                .ToList();

            return clientRevenue;
        }

        private string CalculateRiskLevel(decimal clientRevenue, decimal totalRevenue)
        {
            var percentage = totalRevenue > 0 ? (clientRevenue / totalRevenue) * 100 : 0;
            return percentage switch
            {
                >= 20 => "HIGH",
                >= 10 => "MEDIUM",
                _ => "LOW"
            };
        }

        private async Task<RevenueForecastDTO> CalculateRevenueForecast(IEnumerable<Quotation> pendingQuotations)
        {
            var forecast = new RevenueForecastDTO();

            foreach (var quotation in pendingQuotations)
            {
                // Obtener historial del cliente por DNI
                var customer = await _customerRepository.GetByIdAsync(quotation.CustomerId);
                if (customer == null) continue;

                var customerBudgets = await _budgetRepository.GetCustomerBudgetHistoryAsync(customer.dni);
                var conversionRate = CalculateCustomerConversionRate(customerBudgets);

                var pendingQuotation = new PendingQuotationDTO
                {
                    ClientName = $"{customer.name} {customer.lastname}",
                    WorkPlaceName = quotation.WorkPlace?.name ?? string.Empty,
                    WorkPlaceLocation = quotation.WorkPlace?.location ?? string.Empty,
                    AgentName = await GetAgentName(customer),
                    QuotatorName = $"{quotation.User?.name} {quotation.User?.lastName}",
                    CreationDate = quotation.CreationDate,
                    TotalAmount = quotation.TotalPrice,
                    ConversionRate = conversionRate,
                    ProbabilityLevel = conversionRate >= 0.7m ? "HIGH" : conversionRate >= 0.4m ? "MEDIUM" : "LOW",
                    VersionCount = customerBudgets.Count(b => b.status == BudgetStatus.Rejected) + 1,
                    InitialAmount = customerBudgets.OrderBy(b => b.creationDate).FirstOrDefault()?.Total ?? quotation.TotalPrice
                };

                // Agregar a la categoría correspondiente
                if (pendingQuotation.ProbabilityLevel == "HIGH")
                    forecast.HighProbability.Add(pendingQuotation);
                else if (pendingQuotation.ProbabilityLevel == "MEDIUM")
                    forecast.MediumProbability.Add(pendingQuotation);
            }

            return forecast;
        }
        //TODO: ESTADO DE PRUEBA - Ajusta la tasa de conversion a porcentajes realistas antes de desplegar
        private decimal CalculateCustomerConversionRate(List<Budget> customerBudgets)
        {
            if (!customerBudgets.Any()) return 0.6m; // 60% para clientes nuevos

            var totalBudgets = customerBudgets.Count();

            // Considerar tanto "approved" como "finished" como conversiones exitosas
            var successfulBudgets = customerBudgets.Count(b =>
                b.status == BudgetStatus.Accepted ||
                b.status.ToString().ToLower() == "finished");

            // Penalidad más suave por versiones rechazadas
            var rejectedVersions = customerBudgets.Count(b => b.status == BudgetStatus.Rejected);
            var versionPenalty = Math.Min(0.3m, rejectedVersions * 0.03m); // 3% por rechazo, máximo 30%

            var baseRate = (decimal)successfulBudgets / totalBudgets;

            // Si el cliente tiene al menos 1 éxito, dar probabilidad mínima más alta
            var minProbability = successfulBudgets > 0 ? 0.4m : 0.2m;

            return Math.Max(minProbability, baseRate - versionPenalty);
        }

        private decimal CalculateVersionPenalty(List<Budget> customerBudgets)
        {
            var rejectedVersions = customerBudgets.Count(b => b.status == BudgetStatus.Rejected);
            // Penalidad: 5% por cada versión rechazada, máximo 40%
            return Math.Min(0.4m, rejectedVersions * 0.05m);
        }

        private async Task<string> GetAgentName(Customer customer)
        {
            // Aquí necesitarías un método para obtener el agente del cliente
            // Por ahora retornamos un valor por defecto
            return "Sin agente asignado";
        }

        private async Task<BusinessHealthDTO> CalculateBusinessHealth(
            List<Budget> approvedBudgets,
            List<Budget> allBudgets,
            DateTime fromDate,
            DateTime toDate)
        {
            return new BusinessHealthDTO
            {
                DiversificationScore = CalculateDiversificationScore(approvedBudgets),
                RecurrenceRate = await CalculateRecurrenceRate(approvedBudgets, fromDate, toDate),
                SeasonalityLevel = CalculateSeasonalityLevel(approvedBudgets),
                Strengths = await IdentifyStrengths(approvedBudgets, fromDate, toDate),
                Alerts = await IdentifyAlerts(approvedBudgets),
                Recommendations = await GenerateRecommendations(approvedBudgets, allBudgets)
            };
        }

        private decimal CalculateDiversificationScore(List<Budget> approvedBudgets)
        {
            var totalRevenue = approvedBudgets.Sum(b => b.Total);
            if (totalRevenue == 0) return 0;

            // Índice Herfindahl (1 - SUM(participación^2))
            var clientShares = approvedBudgets
                .GroupBy(b => b.customer.dni)
                .Select(g => g.Sum(b => b.Total) / totalRevenue);

            var hhi = clientShares.Sum(share => share * share);
            return (1 - hhi) * 100; // Convertir a escala 0-100
        }

        private async Task<decimal> CalculateRecurrenceRate(List<Budget> approvedBudgets, DateTime fromDate, DateTime toDate)
        {
            var uniqueClients = approvedBudgets
                .Select(b => b.customer.dni)
                .Distinct()
                .Count();

            var totalActiveClients = await _budgetRepository.GetTotalActiveClientsAsync(fromDate, toDate);

            return totalActiveClients > 0 ? (decimal)uniqueClients / totalActiveClients * 100 : 0;
        }

        private string CalculateSeasonalityLevel(List<Budget> approvedBudgets)
        {
            var monthlyRevenue = approvedBudgets
                .GroupBy(b => new { b.creationDate.Year, b.creationDate.Month })
                .Select(g => g.Sum(b => b.Total))
                .ToList();

            if (!monthlyRevenue.Any()) return "LOW";

            var average = monthlyRevenue.Average();
            var stdDev = Math.Sqrt(monthlyRevenue.Average(v => Math.Pow((double)(v - average), 2)));
            var coefficient = stdDev / (double)average;

            return coefficient switch
            {
                < 0.3 => "LOW",
                < 0.6 => "MEDIUM",
                _ => "HIGH"
            };
        }

        // CORREGIDO: Ahora toma 2 parámetros
        private async Task<List<string>> IdentifyStrengths(List<Budget> approvedBudgets, DateTime fromDate, DateTime toDate)
        {
            var strengths = new List<string>();
            var growthRate = await CalculateGrowthRate(fromDate, toDate);

            if (growthRate > 10)
                strengths.Add("Crecimiento sólido y consistente");

            if (CalculateDiversificationScore(approvedBudgets) > 70)
                strengths.Add("Buena diversificación de clientes");

            // Verificar estacionalidad baja
            if (CalculateSeasonalityLevel(approvedBudgets) == "LOW")
                strengths.Add("Baja estacionalidad - ingresos estables");

            return strengths;
        }

        // CORREGIDO: Ahora toma 1 parámetro y calcula totalRevenue internamente
        private async Task<List<string>> IdentifyAlerts(List<Budget> approvedBudgets)
        {
            var alerts = new List<string>();
            var totalRevenue = approvedBudgets.Sum(b => b.Total);
            var clientConcentration = await CalculateClientConcentration(approvedBudgets);

            var topClient = clientConcentration.FirstOrDefault();
            if (topClient?.Percentage > 20)
                alerts.Add($"Alta dependencia del cliente: {topClient.ClientName} ({topClient.Percentage:F1}%)");

            // Alerta por producto dominante
            var productMix = CalculateProductMix(approvedBudgets);
            var topProduct = productMix.FirstOrDefault();
            if (topProduct?.Percentage > 40)
                alerts.Add($"Alta concentración en producto: {topProduct.ProductName} ({topProduct.Percentage:F1}%)");

            // Alerta por estacionalidad alta
            if (CalculateSeasonalityLevel(approvedBudgets) == "HIGH")
                alerts.Add("Alta estacionalidad detectada - ingresos muy variables");

            return alerts;
        }

        // CORREGIDO: Ahora toma 2 parámetros correctamente
        private async Task<List<string>> GenerateRecommendations(List<Budget> approvedBudgets, List<Budget> allBudgets)
        {
            var recommendations = new List<string>();

            // Ejemplo: si hay alta concentración en un producto
            var productMix = CalculateProductMix(approvedBudgets);
            var topProduct = productMix.FirstOrDefault();
            if (topProduct?.Percentage > 40)
                recommendations.Add($"Desarrollar productos complementarios para {topProduct.ProductName}");

            // Recomendación por dependencia de cliente
            var clientConcentration = await CalculateClientConcentration(approvedBudgets);
            var topClient = clientConcentration.FirstOrDefault();
            if (topClient?.Percentage > 20)
                recommendations.Add($"Diversificar cartera de clientes para reducir dependencia de {topClient.ClientName}");

            // Recomendación por estacionalidad
            if (CalculateSeasonalityLevel(approvedBudgets) == "HIGH")
                recommendations.Add("Desarrollar estrategias para meses de baja demanda");

            // Recomendación basada en tasa de aprobación
            var totalBudgetsCount = allBudgets.Count;
            var approvedBudgetsCount = approvedBudgets.Count;
            var approvalRate = totalBudgetsCount > 0 ? (decimal)approvedBudgetsCount / totalBudgetsCount * 100 : 0;

            if (approvalRate < 30)
                recommendations.Add("Mejorar procesos de cotización para aumentar tasa de aprobación");

            return recommendations;
        }
    }
}