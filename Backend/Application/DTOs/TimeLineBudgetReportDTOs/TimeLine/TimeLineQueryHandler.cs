using Application.DTOs.BudgetDTOs.GetBudgetByCustomerDni;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.DTOs.TimeLineBudgetReportDTOs.TimeLine
{
    public class TimelineQueryHandler : IRequestHandler<TimelineQuery, List<BudgetTimeLineDTO>>
    {
        private readonly IMediator _mediator;
        private readonly ILogger<TimelineQueryHandler> _logger;

        public TimelineQueryHandler(
            IMediator mediator,
            ILogger<TimelineQueryHandler> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        public async Task<List<BudgetTimeLineDTO>> Handle(TimelineQuery request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Buscando timeline para cliente con DNI: {CustomerDni}", request.CustomerDni);

            if (string.IsNullOrEmpty(request.CustomerDni))
            {
                _logger.LogWarning("DNI del cliente está vacío");
                return new List<BudgetTimeLineDTO>();
            }

            // ✅ Obtener TODAS las cotizaciones del cliente por DNI
            var getBudgetsQuery = new GetBudgetByCustomerDniQuery(request.CustomerDni);
            var allBudgets = await _mediator.Send(getBudgetsQuery, cancellationToken);

            _logger.LogInformation("Encontrados {Count} budgets para DNI: {CustomerDni}",
                allBudgets.Count, request.CustomerDni);

            if (!allBudgets.Any())
            {
                _logger.LogWarning("No se encontraron budgets para DNI: {CustomerDni}", request.CustomerDni);
                return new List<BudgetTimeLineDTO>();
            }

            // Aplicar filtros
            var filteredBudgets = allBudgets.AsEnumerable();

            if (!string.IsNullOrEmpty(request.BudgetIdFilter))
            {
                filteredBudgets = filteredBudgets.Where(b =>
                    b.budgetId.Contains(request.BudgetIdFilter));
                _logger.LogInformation("Después de filtrar por BudgetId: {Count} budgets", filteredBudgets.Count());
            }

            if (request.FromDate.HasValue)
            {
                filteredBudgets = filteredBudgets.Where(b =>
                    b.creationDate >= request.FromDate.Value);
                _logger.LogInformation("Después de filtrar por FromDate: {Count} budgets", filteredBudgets.Count());
            }

            if (request.ToDate.HasValue)
            {
                filteredBudgets = filteredBudgets.Where(b =>
                    b.creationDate <= request.ToDate.Value);
                _logger.LogInformation("Después de filtrar por ToDate: {Count} budgets", filteredBudgets.Count());
            }

            // Agrupar por BudgetId y crear timeline
            var timelineData = filteredBudgets
                .GroupBy(b => b.budgetId)
                .Select(g => new BudgetTimeLineDTO
                {
                    BudgetId = g.Key,
                    WorkPlaceName = g.First().workPlace?.name ?? "Sin nombre de obra",
                    CreationDate = g.Min(b => b.creationDate),
                    Status = g.OrderByDescending(b => b.version).First().status,
                    Versions = g.OrderBy(b => b.version)
                        .Select(b => new BudgetVersionDTO
                        {
                            Id = b.budgetId, // Usar budgetId como ID temporal
                            BudgetId = b.budgetId,
                            Version = b.version,
                            CreationDate = b.creationDate,
                            Status = b.status,
                            Total = b.Total,
                            Comment = b.Comment
                        }).ToList()
                })
                .OrderByDescending(t => t.CreationDate)
                .ToList();

            _logger.LogInformation("Timeline generada: {Count} grupos con {TotalVersions} versiones totales",
                timelineData.Count, timelineData.Sum(t => t.Versions.Count));

            // Debug: mostrar cada grupo generado
            foreach (var timeline in timelineData)
            {
                _logger.LogInformation("Grupo: BudgetId={BudgetId}, Versiones={VersionCount}, Estado={Status}",
                    timeline.BudgetId, timeline.Versions.Count, timeline.Status);
            }

            return timelineData;
        }
    }
}