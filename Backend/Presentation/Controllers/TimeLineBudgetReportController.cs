using Application.DTOs.TimeLineBudgetReportDTOs.CustomerList;
using Application.DTOs.TimeLineBudgetReportDTOs.TimeLine;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/TimeLineBudgetReport")]
    public class TimeLineBudgetReportController : ControllerBase
    {
        private readonly IMediator _mediator;

        public TimeLineBudgetReportController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("customers")]
        public async Task<ActionResult<List<CustomerListDTO>>> GetClientReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? status = null,
            [FromQuery] string? customerName = null,
            [FromQuery] string? workPlaceName = null,
            [FromQuery] string? productType = null,
            [FromQuery] string? search = null)
        {
            var query = new CustomerListQuery
            {
                FromDate = fromDate,
                ToDate = toDate,
                StatusFilter = status,
                CustomerName = customerName,
                WorkPlaceName = workPlaceName,
                ProductType = productType,
                SearchTerm = search
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        // ENDPOINT PRINCIPAL - Timeline por DNI del cliente
        [HttpGet("{dni}")]
        public async Task<ActionResult<List<BudgetTimeLineDTO>>> GetTimeline(
        string dni,
        [FromQuery] string? fromDate,
        [FromQuery] string? toDate,
        [FromQuery] decimal? montoMin,
        [FromQuery] decimal? montoMax,
        [FromQuery] string? ubicacion,
        [FromQuery] string? usuarioGenerador,
        [FromQuery] string? agenteDni,
        [FromQuery] string? tipoProducto,
        [FromQuery] string? ordenMonto = "desc",
        [FromQuery] string? ordenFecha = "desc")
        {
            var query = new TimelineQuery
            {
                CustomerDni = dni,
                FromDate = fromDate != null ? DateTime.Parse(fromDate) : null,
                ToDate = toDate != null ? DateTime.Parse(toDate) : null,
                MontoMin = montoMin,
                MontoMax = montoMax,
                Ubicacion = ubicacion,
                UsuarioGenerador = usuarioGenerador,
                AgenteDni = agenteDni,
                TipoProducto = tipoProducto,
                OrdenMonto = ordenMonto,
                OrdenFecha = ordenFecha
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        // ✅ ENDPOINT ALTERNATIVO - Para compatibilidad con IDs numéricos
        [HttpGet("timeline/{customerId}")]
        public async Task<ActionResult<List<BudgetTimeLineDTO>>> GetCustomerTimeline(
            int customerId,
            [FromQuery] string? budgetId = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            // Primero necesitamos obtener el DNI del customer desde SQL
            // Esto requiere una consulta adicional, pero mantiene la compatibilidad
            var customerDni = await GetCustomerDniById(customerId);

            if (string.IsNullOrEmpty(customerDni))
            {
                return NotFound($"No se encontró el cliente con ID: {customerId}");
            }

            var query = new TimelineQuery
            {
                CustomerDni = customerDni,
                BudgetIdFilter = budgetId,
                FromDate = fromDate,
                ToDate = toDate
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        // ✅ ENDPOINT DE DEBUG
        [HttpGet("debug/dni/{customerDni}")]
        public async Task<ActionResult> DebugTimelineByDni(string customerDni)
        {
            try
            {
                var query = new TimelineQuery { CustomerDni = customerDni };
                var result = await _mediator.Send(query);

                return Ok(new
                {
                    CustomerDni = customerDni,
                    TimelineCount = result.Count,
                    TotalVersions = result.Sum(t => t.Versions.Count),
                    TimelineData = result.Select(t => new
                    {
                        t.BudgetId,
                        t.WorkPlaceName,
                        t.CreationDate,
                        t.Status,
                        VersionCount = t.Versions.Count,
                        Versions = t.Versions.Select(v => new {
                            v.Version,
                            v.Status,
                            v.Total,
                            v.CreationDate
                        })
                    })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = ex.Message,
                    CustomerDni = customerDni
                });
            }
        }

        private async Task<string?> GetCustomerDniById(int customerId)
        {
            // Aquí necesitarías inyectar un repositorio de customers
            // o hacer una consulta para obtener el DNI por customerId
            // Por ahora retornamos null (implementación temporal)
            return null;
        }
    }
}