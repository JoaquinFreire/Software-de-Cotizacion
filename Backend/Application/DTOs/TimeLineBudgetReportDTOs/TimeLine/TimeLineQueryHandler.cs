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

            // Filtros existentes
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

            // Filtro por Monto
            if (request.MontoMin.HasValue)
            {
                filteredBudgets = filteredBudgets.Where(b => b.Total >= request.MontoMin.Value);
                _logger.LogInformation("Después de filtrar por MontoMin {MontoMin}: {Count} budgets",
                    request.MontoMin, filteredBudgets.Count());
            }

            if (request.MontoMax.HasValue)
            {
                filteredBudgets = filteredBudgets.Where(b => b.Total <= request.MontoMax.Value);
                _logger.LogInformation("Después de filtrar por MontoMax {MontoMax}: {Count} budgets",
                    request.MontoMax, filteredBudgets.Count());
            }

            // Filtro por Ubicación
            if (!string.IsNullOrEmpty(request.Ubicacion))
            {
                filteredBudgets = filteredBudgets.Where(b =>
                    b.workPlace.location.Contains(request.Ubicacion) ||
                    b.workPlace.address.Contains(request.Ubicacion));
                _logger.LogInformation("Después de filtrar por Ubicación {Ubicacion}: {Count} budgets",
                    request.Ubicacion, filteredBudgets.Count());
            }

            // Filtro por Usuario
            if (!string.IsNullOrEmpty(request.UsuarioGenerador))
            {
                filteredBudgets = filteredBudgets.Where(b =>
                    // Buscar el nombre completo en el campo 'name'
                    b.user.name.Contains(request.UsuarioGenerador) ||
                    // Buscar el nombre completo en el campo 'lastName'  
                    b.user.lastName.Contains(request.UsuarioGenerador) ||
                    // O buscar por partes separadas (nombre en name, apellido en lastName)
                    (b.user.name + " " + b.user.lastName).Contains(request.UsuarioGenerador) ||
                    (b.user.lastName + " " + b.user.name).Contains(request.UsuarioGenerador) ||
                    // O buscar por email
                    b.user.mail.Contains(request.UsuarioGenerador));

                _logger.LogInformation("Después de filtrar por UsuarioGenerador {Usuario}: {Count} budgets",
                    request.UsuarioGenerador, filteredBudgets.Count());
            }

            // Filtro por Agente
            if (!string.IsNullOrEmpty(request.AgenteDni))
            {
                filteredBudgets = filteredBudgets.Where(b =>
                    b.agent.dni == request.AgenteDni);
                _logger.LogInformation("Después de filtrar por Agente DNI {AgenteDni}: {Count} budgets",
                    request.AgenteDni, filteredBudgets.Count());
            }

            // Filtro por Tipo de Producto (más complejo - busca en productos y complements)
            if (!string.IsNullOrEmpty(request.TipoProducto))
            {
                filteredBudgets = filteredBudgets.Where(b =>
                {
                    var searchTerm = request.TipoProducto;

                    // Buscar en productos principales
                    var tieneEnProductos = b.Products.Any(p =>
                        p.OpeningType.name.Contains(searchTerm));

                    // Buscar en complementos
                    var tieneEnComplementos = b.Complement != null && (
                        // Complementos de puertas
                        b.Complement.Any(c => c.ComplementDoor.Any(d => d.Name.Contains(searchTerm))) ||
                        // Complementos de barandas
                        b.Complement.Any(c => c.ComplementRailing.Any(r => r.Name.Contains(searchTerm))) ||
                        // Complementos de tabiques
                        b.Complement.Any(c => c.ComplementPartition.Any(p => p.Name.Contains(searchTerm)))
                    );

                    return tieneEnProductos || tieneEnComplementos;
                });

                _logger.LogInformation("Después de filtrar por TipoProducto {TipoProducto}: {Count} budgets",
                    request.TipoProducto, filteredBudgets.Count());
            }

            // Agrupar por BudgetId y crear timeline
            var groupedBudgets = filteredBudgets
                .GroupBy(b => b.budgetId)
                .Select(g => new
                {
                    BudgetId = g.Key,
                    WorkPlaceName = g.First().workPlace?.name ?? "Sin nombre de obra",
                    CreationDate = g.Min(b => b.creationDate),
                    Status = g.OrderByDescending(b => b.version).First().status,
                    MaxTotal = g.Max(b => b.Total), // Para ordenamiento por monto
                    Versions = g.OrderBy(b => b.version)
                        .Select(b => new BudgetVersionDTO
                        {
                            Id = b.budgetId,
                            BudgetId = b.budgetId,
                            Version = b.version,
                            CreationDate = b.creationDate,
                            Status = b.status,
                            Total = b.Total,
                            Comment = b.Comment
                        }).ToList()
                });

            // ✅ APLICAR ORDENAMIENTO
            IOrderedEnumerable<dynamic> orderedGroups;

            // Ordenamiento primario por fecha
            if (request.OrdenFecha?.ToLower() == "asc")
            {
                orderedGroups = groupedBudgets.OrderBy(g => g.CreationDate);
            }
            else
            {
                orderedGroups = groupedBudgets.OrderByDescending(g => g.CreationDate);
            }

            // Ordenamiento secundario por monto
            if (request.OrdenMonto?.ToLower() == "asc")
            {
                orderedGroups = orderedGroups.ThenBy(g => g.MaxTotal);
            }
            else if (request.OrdenMonto?.ToLower() == "desc")
            {
                orderedGroups = orderedGroups.ThenByDescending(g => g.MaxTotal);
            }

            var timelineData = orderedGroups
                .Select(g => new BudgetTimeLineDTO
                {
                    BudgetId = g.BudgetId,
                    WorkPlaceName = g.WorkPlaceName,
                    CreationDate = g.CreationDate,
                    Status = g.Status,
                    Versions = g.Versions
                })
                .ToList();

            _logger.LogInformation("Timeline generada: {Count} grupos con {TotalVersions} versiones totales",
                timelineData.Count, timelineData.Sum(t => t.Versions.Count));

            return timelineData;
        }
    }
}