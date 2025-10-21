using Domain.Entities;
using Domain.Enums;
using Domain.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class QuoterPersonalMetricsHandler : IRequestHandler<QuoterPersonalMetricsQuery, QuoterPersonalMetricsDTO>
    {
        private readonly IQuotationRepository _quotationRepository;
        private readonly IBudgetRepository _budgetRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<QuoterPersonalMetricsHandler> _logger;

        public QuoterPersonalMetricsHandler(
            IQuotationRepository quotationRepository,
            IBudgetRepository budgetRepository,
            ICustomerRepository customerRepository,
            IUserRepository userRepository,
            ILogger<QuoterPersonalMetricsHandler> logger)
        {
            _quotationRepository = quotationRepository;
            _budgetRepository = budgetRepository;
            _customerRepository = customerRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<QuoterPersonalMetricsDTO> Handle(QuoterPersonalMetricsQuery request, CancellationToken cancellationToken)
        {

            try
            {
                _logger.LogInformation($"Iniciando métricas para usuario {request.QuoterId}, desde {request.FromDate} hasta {request.ToDate}");

                // Obtener datos del cotizador
                var quoter = await _userRepository.GetByIdAsync(request.QuoterId);
                if (quoter == null)
                    throw new ArgumentException($"Cotizador con ID {request.QuoterId} no encontrado");

                // Obtener cotizaciones del período desde SQL
                var quotations = await _quotationRepository.GetByQuoterAndPeriodAsync(
                    request.QuoterId,
                    request.FromDate,
                    request.ToDate);

                _logger.LogInformation($"Encontradas {quotations.Count()} cotizaciones en SQL");

                // Obtener los BudgetIds de las cotizaciones de SQL
                var budgetIds = quotations.Select(q => q.Id.ToString()).ToList();
                _logger.LogInformation($"BudgetIds a buscar en MongoDB: {string.Join(", ", budgetIds)}");

                // Obtener budgets de MongoDB usando los BudgetIds
                var budgets = new List<Budget>();
                foreach (var budgetId in budgetIds)
                {
                    var budget = await _budgetRepository.GetByBudgetIdAsync(budgetId);
                    if (budget != null)
                    {
                        budgets.Add(budget);
                    }
                }

                _logger.LogInformation($"Encontrados {budgets.Count} documentos en MongoDB");


                // Obtener datos del cotizador
                quoter = await _userRepository.GetByIdAsync(request.QuoterId);
                if (quoter == null)
                    throw new ArgumentException($"Cotizador con ID {request.QuoterId} no encontrado");

                // Obtener cotizaciones del período desde SQL (esto SÍ funciona)
                quotations = await _quotationRepository.GetByQuoterAndPeriodAsync(
                    request.QuoterId,
                    request.FromDate,
                    request.ToDate);

                // Obtener los BudgetIds de las cotizaciones de SQL
                budgetIds = quotations.Select(q => q.Id.ToString()).ToList();

                // Obtener budgets de MongoDB usando los BudgetIds
                budgets = new List<Budget>();
                foreach (var budgetId in budgetIds)
                {
                    var budget = await _budgetRepository.GetByBudgetIdAsync(budgetId);
                    if (budget != null)
                    {
                        budgets.Add(budget);
                    }
                }

                // Construir el DTO
                return new QuoterPersonalMetricsDTO
                {
                    PerformanceSummary = await BuildPerformanceSummary(quoter, quotations, budgets, request.QuoterId),
                    KeyMetrics = CalculateKeyMetrics(quotations, budgets),
                    MonthlyTrends = CalculateMonthlyTrends(quotations, request.FromDate, request.ToDate),
                    ProductEfficiency = CalculateProductEfficiency(budgets),
                    ClientHighlights = CalculateClientHighlights(quotations, request.FromDate),
                    ImmediateActions = GenerateImmediateActions(quotations)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generando métricas personales para cotizador {QuoterId}", request.QuoterId);
                throw;
            }
        }

        private async Task<PerformanceSummaryDTO> BuildPerformanceSummary(
            User quoter,
            IEnumerable<Quotation> quotations,
            IEnumerable<Budget> budgets,
            int quoterId)
        {
            var totalQuotations = quotations.Count();
            var acceptedQuotations = quotations.Count(q => q.Status.ToLower() == "approved");
            var conversionRate = totalQuotations > 0 ? (decimal)acceptedQuotations / totalQuotations : 0;

            return new PerformanceSummaryDTO
            {
                QuoterName = $"{quoter.name} {quoter.lastName}",
                PerformanceTier = GetPerformanceTier(conversionRate),
                OverallScore = CalculateOverallScore(quotations, budgets),
                Strengths = IdentifyStrengths(budgets, quotations), // ✅ Actualizado
                AreasForImprovement = IdentifyImprovementAreas(quotations, budgets),
                CurrentRank = await CalculateCurrentRank(quoterId, quotations), // ✅ Actualizado
                TotalQuoters = await _userRepository.GetActiveQuotersCountAsync()
            };
        }

        private KeyMetricsDTO CalculateKeyMetrics(IEnumerable<Quotation> quotations, IEnumerable<Budget> budgets)
        {
            var totalQuotations = quotations.Count();
            var acceptedQuotations = quotations.Count(q => q.Status.ToLower() == "approved");
            var pendingQuotations = quotations.Count(q => q.Status.ToLower() == "pending");
            var rejectedQuotations = quotations.Count(q => q.Status.ToLower() == "rejected");

            var conversionRate = totalQuotations > 0 ? (decimal)acceptedQuotations / totalQuotations : 0;
            var totalRevenue = acceptedQuotations > 0 ?
                quotations.Where(q => q.Status.ToLower() == "approved").Sum(q => q.TotalPrice) : 0;
            var averageQuotationValue = acceptedQuotations > 0 ? totalRevenue / acceptedQuotations : 0;

            return new KeyMetricsDTO
            {
                TotalQuotations = totalQuotations,
                AcceptedQuotations = acceptedQuotations,
                PendingQuotations = pendingQuotations,
                RejectedQuotations = rejectedQuotations,
                ConversionRate = conversionRate,
                TotalRevenue = totalRevenue,
                AverageQuotationValue = averageQuotationValue,
                AverageResponseTimeHours = CalculateAverageResponseTime(budgets, quotations), // ✅ Actualizado
                AverageTimeToCloseDays = CalculateAverageTimeToClose(quotations),
                ActiveClients = quotations.Select(q => q.CustomerId).Distinct().Count()
            };
        }

        private List<MonthlyPerformanceDTO> CalculateMonthlyTrends(
            IEnumerable<Quotation> quotations,
            DateTime? fromDate,
            DateTime? toDate)
        {
            var startDate = fromDate ?? DateTime.UtcNow.AddMonths(-6);
            var endDate = toDate ?? DateTime.UtcNow;

            var monthlyData = quotations
                .Where(q => q.CreationDate >= startDate && q.CreationDate <= endDate)
                .GroupBy(q => new { q.CreationDate.Year, q.CreationDate.Month })
                .Select(g => new MonthlyPerformanceDTO
                {
                    Month = $"{g.Key.Month:00}/{g.Key.Year}",
                    Quotations = g.Count(),
                    Accepted = g.Count(q => q.Status.ToLower() == "approved"),
                    ConversionRate = g.Count() > 0 ?
                        (decimal)g.Count(q => q.Status.ToLower() == "approved") / g.Count() : 0,
                    Revenue = g.Where(q => q.Status.ToLower() == "approved").Sum(q => q.TotalPrice),
                    Trend = CalculateTrend(g, quotations)
                })
                .OrderBy(m => m.Month)
                .ToList();

            return monthlyData;
        }

        private List<ProductEfficiencyDTO> CalculateProductEfficiency(IEnumerable<Budget> budgets)
        {
            if (!budgets.Any()) return new List<ProductEfficiencyDTO>();

            var productStats = budgets
                .SelectMany(b => b.Products.Select(p => new { Budget = b, Product = p }))
                .Where(x => x.Product.OpeningType != null)
                .GroupBy(x => x.Product.OpeningType.name)
                .Select(g => new ProductEfficiencyDTO
                {
                    OpeningType = g.Key,
                    TotalQuotations = g.Count(),
                    Accepted = g.Count(x => x.Budget.status == BudgetStatus.Approved),
                    ConversionRate = g.Count() > 0 ?
                        (decimal)g.Count(x => x.Budget.status == BudgetStatus.Approved) / g.Count() : 0,
                    AverageValue = g.Where(x => x.Product.price.HasValue).Any() ?
                        g.Where(x => x.Product.price.HasValue).Average(x => x.Product.price.Value) : 0,
                    Performance = GetPerformanceLevel(
                        g.Count(x => x.Budget.status == BudgetStatus.Approved),
                        g.Count())
                })
                .Where(p => p.TotalQuotations > 0)
                .OrderByDescending(p => p.ConversionRate)
                .ToList();

            return productStats;
        }

        private ClientHighlightsDTO CalculateClientHighlights(IEnumerable<Quotation> quotations, DateTime? fromDate)
        {
            var clientQuotations = quotations
                .Where(q => q.Customer != null)
                .GroupBy(q => q.CustomerId)
                .ToList();

            if (!clientQuotations.Any())
            {
                return new ClientHighlightsDTO
                {
                    TotalClients = 0,
                    TopClient = "N/A",
                    TopClientRevenue = 0,
                    RepeatClients = 0,
                    RetentionRate = 0,
                    NewClientsThisPeriod = 0
                };
            }

            var topClientGroup = clientQuotations
                .OrderByDescending(g => g.Where(q => q.Status.ToLower() == "approved").Sum(q => q.TotalPrice))
                .FirstOrDefault();

            // Calcular nuevos clientes CORREGIDO: primera cotización en el período
            var newClients = fromDate.HasValue ?
                clientQuotations.Count(g => g.Any(q => q.CreationDate >= fromDate.Value)) : 0;

            return new ClientHighlightsDTO
            {
                TotalClients = clientQuotations.Count,
                TopClient = topClientGroup?.First().Customer?.name ?? "N/A",
                TopClientRevenue = topClientGroup?.Where(q => q.Status.ToLower() == "approved").Sum(q => q.TotalPrice) ?? 0,
                RepeatClients = clientQuotations.Count(g => g.Count() > 1),
                RetentionRate = CalculateRetentionRate(quotations),
                NewClientsThisPeriod = newClients
            };
        }

        private List<ActionItemDTO> GenerateImmediateActions(IEnumerable<Quotation> quotations)
        {
            var actions = new List<ActionItemDTO>();

            // Pendientes antiguos (más de 7 días)
            var oldPending = quotations
                .Where(q => q.Status.ToLower() == "pending" &&
                           q.CreationDate < DateTime.UtcNow.AddDays(-7))
                .ToList();

            if (oldPending.Any())
            {
                actions.Add(new ActionItemDTO
                {
                    Action = $"Seguir {oldPending.Count} cotizaciones pendientes antiguas",
                    Priority = "Alta",
                    DueDate = "Hoy",
                    Impact = "Alto"
                });
            }

            // Clientes con múltiples rechazos
            var problematicClients = quotations
                .Where(q => q.Customer != null)
                .GroupBy(q => q.CustomerId)
                .Where(g => g.Count(q => q.Status.ToLower() == "rejected") >= 2)
                .ToList();

            if (problematicClients.Any())
            {
                actions.Add(new ActionItemDTO
                {
                    Action = $"Revisar {problematicClients.Count} clientes con múltiples rechazos",
                    Priority = "Media",
                    DueDate = "Esta semana",
                    Impact = "Medio"
                });
            }

            return actions;
        }

        // Métodos auxiliares
        private decimal CalculateOverallScore(IEnumerable<Quotation> quotations, IEnumerable<Budget> budgets)
        {
            if (!quotations.Any()) return 0;

            var conversionRate = (decimal)quotations.Count(q => q.Status.ToLower() == "approved") / quotations.Count();
            var revenueScore = Math.Min(quotations.Where(q => q.Status.ToLower() == "approved").Sum(q => q.TotalPrice) / 50000, 1);
            var timeScore = CalculateAverageResponseTime(budgets, quotations) < 48 ? 1.0m : 0.5m;
            return (conversionRate * 40 + revenueScore * 30 + timeScore * 30);
        }

        private string GetPerformanceTier(decimal conversionRate)
        {
            return conversionRate switch
            {
                >= 0.7m => "Alto",
                >= 0.4m => "Medio",
                _ => "Bajo"
            };
        }

        private double CalculateAverageResponseTime(IEnumerable<Budget> budgets, IEnumerable<Quotation> quotations)
        {
            if (!budgets.Any()) return 0;

            // Intentar calcular desde creación hasta primera modificación
            // Si no hay datos de modificación, usar un cálculo más realista
            var validBudgets = budgets.Where(b =>
                b.creationDate != default &&
                b.creationDate < DateTime.UtcNow.AddDays(-1) // Excluir muy recientes
            ).ToList();

            if (!validBudgets.Any()) return 0;

            // Calcular tiempo promedio desde creación
            var averageHours = validBudgets.Average(b =>
            {
                var timeSpan = DateTime.UtcNow - b.creationDate;
                return Math.Min(timeSpan.TotalHours, 720); // Limitar a 30 días máximo
            });

            return Math.Round(averageHours, 1);
        }

        private double CalculateAverageTimeToClose(IEnumerable<Quotation> quotations)
        {
            var closedQuotations = quotations
                .Where(q => q.Status.ToLower() != "pending" && q.CreationDate != default)
                .ToList();

            if (!closedQuotations.Any()) return 0;

            return closedQuotations.Average(q => (q.LastEdit - q.CreationDate).TotalDays);
        }

        private string CalculateTrend(IGrouping<dynamic, Quotation> currentGroup, IEnumerable<Quotation> allQuotations)
        {
            var currentMonthQuotations = currentGroup.Count();

            var previousMonths = allQuotations
                .Where(q => q.CreationDate < currentGroup.First().CreationDate)
                .GroupBy(q => new { q.CreationDate.Year, q.CreationDate.Month })
                .ToList();

            if (!previousMonths.Any()) return "stable";

            var previousMonthsAvg = previousMonths.Average(g => g.Count());
            return currentMonthQuotations > previousMonthsAvg ? "up" : "down";
        }

        private string GetPerformanceLevel(int accepted, int total)
        {
            var rate = (decimal)accepted / total;
            return rate switch
            {
                >= 0.7m => "Excelente",
                >= 0.5m => "Buena",
                >= 0.3m => "Regular",
                _ => "Baja"
            };
        }

        private decimal CalculateRetentionRate(IEnumerable<Quotation> quotations)
        {
            var clients = quotations.Select(q => q.CustomerId).Distinct().Count();
            var repeatClients = quotations
                .GroupBy(q => q.CustomerId)
                .Count(g => g.Count() > 1);

            return clients > 0 ? (decimal)repeatClients / clients * 100 : 0;
        }

        private string IdentifyStrengths(IEnumerable<Budget> budgets, IEnumerable<Quotation> quotations)
        {
            var strengths = new List<string>();

            // 1. Verificar si tiene meses con 100% de conversión
            var monthlyTrends = CalculateMonthlyTrends(quotations, null, null);
            var perfectMonths = monthlyTrends.Where(m => m.ConversionRate == 1).ToList();
            if (perfectMonths.Any())
            {
                strengths.Add($"{perfectMonths.Count} mes(es) con conversión perfecta");
            }

            // 2. Verificar volumen de cotizaciones
            var totalQuotations = quotations.Count();
            if (totalQuotations >= 10)
            {
                strengths.Add($"Alto volumen de cotizaciones ({totalQuotations})");
            }

            // 3. Verificar productos con mejor desempeño
            var productEfficiency = CalculateProductEfficiency(budgets);
            var bestProduct = productEfficiency
                .Where(p => p.ConversionRate > 0.3m)
                .OrderByDescending(p => p.ConversionRate)
                .FirstOrDefault();

            if (bestProduct != null)
            {
                strengths.Add($"Mejor desempeño en {bestProduct.OpeningType} ({(bestProduct.ConversionRate * 100):F1}%)");
            }

            // 4. Verificar si tiene clientes recurrentes
            var clientHighlights = CalculateClientHighlights(quotations, null);
            if (clientHighlights.RepeatClients > 0)
            {
                strengths.Add($"{clientHighlights.RepeatClients} cliente(s) recurrente(s)");
            }

            return strengths.Any() ? string.Join(", ", strengths) : "Potencial en desarrollo";
        }

        private string IdentifyImprovementAreas(IEnumerable<Quotation> quotations, IEnumerable<Budget> budgets)
        {
            var areas = new List<string>();

            var pendingCount = quotations.Count(q => q.Status.ToLower() == "pending");
            var totalCount = quotations.Count();

            if (pendingCount > totalCount * 0.3m)
                areas.Add("Seguimiento de pendientes");

            var avgResponseTime = CalculateAverageResponseTime(budgets, quotations); // ✅ Agregar quotations
            if (avgResponseTime > 72)
                areas.Add("Tiempo de respuesta");

            return areas.Any() ? string.Join(", ", areas) : "Sin áreas críticas identificadas";
        }

        private async Task<int> CalculateCurrentRank(int quoterId, IEnumerable<Quotation> quotations)
        {
            try
            {
                // Obtener todos los cotizadores activos
                var allQuoters = await _userRepository.GetAllActiveAsync();
                var activeQuoterIds = allQuoters.Select(u => u.id).ToList();

                // Obtener todas las cotizaciones para calcular ranking real
                var allQuotations = await _quotationRepository.GetAllAsync();

                // Calcular conversión por cotizador
                var quoterPerformance = activeQuoterIds
                    .Select(qid => new
                    {
                        QuoterId = qid,
                        Quotations = allQuotations.Where(q => q.UserId == qid).ToList(),
                        Accepted = allQuotations.Count(q => q.UserId == qid && q.Status.ToLower() == "approved"),
                        ConversionRate = allQuotations.Any(q => q.UserId == qid) ?
                            (decimal)allQuotations.Count(q => q.UserId == qid && q.Status.ToLower() == "approved") /
                            allQuotations.Count(q => q.UserId == qid) : 0
                    })
                    .Where(q => q.Quotations.Any()) // Solo cotizadores con actividad
                    .OrderByDescending(q => q.ConversionRate)
                    .ThenByDescending(q => q.Accepted)
                    .ToList();

                // Encontrar posición del cotizador actual
                var currentQuoterIndex = quoterPerformance.FindIndex(q => q.QuoterId == quoterId);

                return currentQuoterIndex >= 0 ? currentQuoterIndex + 1 : quoterPerformance.Count + 1;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error calculando ranking, usando cálculo simple");
                // Fallback: cálculo simple basado en conversión
                var quoterAccepted = quotations.Count(q => q.Status.ToLower() == "approved");
                var totalQuotations = quotations.Count();
                return totalQuotations > 0 ? (int)((decimal)quoterAccepted / totalQuotations * 100) : 0;
            }
        }
    }
}