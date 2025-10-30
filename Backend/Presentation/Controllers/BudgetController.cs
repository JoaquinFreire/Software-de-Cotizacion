using Application.DTOs.BudgetDTOs.CreateBudget;
using Application.DTOs.BudgetDTOs.GetBudget;
using Application.DTOs.BudgetDTOs.GetBudgetByCustomerDni;
using Application.DTOs.BudgetDTOs.DeleteBudget;
using Application.Services;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Presentation.Request;
using Application.DTOs.BudgetDTOs.GetAllBudgetByComplement;
using System.Text.Json; // <-- para serializar en consola
using System.Linq; // <--- agregado

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/Mongo")]
    public class BudgetController : ControllerBase
    {
        private readonly BudgetServices _budgetService;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;

        public BudgetController(BudgetServices budgetService, IMapper mapper, IMediator mediator)
        {
            _budgetService = budgetService;
            _mapper = mapper;
            _mediator = mediator;
        }

        // Nuevo endpoint: devuelve todas las versiones para un BudgetId (ordenadas: la más reciente primero)
        [HttpGet("GetBudgetVersions/{budgetId}")]
        public async Task<IActionResult> GetBudgetVersions(string budgetId)
        {
            if (string.IsNullOrEmpty(budgetId))
                return BadRequest("BudgetId requerido.");

            var allBudgets = await _budgetService.GetAllBudgetsAsync();

            // Filtrar por BudgetId de forma robusta (soporta propiedades 'budgetId' o 'BudgetId')
            var matches = allBudgets.Where(b =>
            {
                try
                {
                    var t = b.GetType();
                    var p1 = t.GetProperty("budgetId");
                    var p2 = t.GetProperty("BudgetId");
                    var val = p1?.GetValue(b) ?? p2?.GetValue(b);
                    return val != null && val.ToString() == budgetId;
                }
                catch
                {
                    return false;
                }
            }).ToList();

            if (!matches.Any())
                return NotFound("No se encontraron cotizaciones con el BudgetId indicado.");

            // Ordenar: intentar por 'version' (numérica si posible), si no por fecha de creación
            var ordered = matches
                .OrderByDescending(b =>
                {
                    try
                    {
                        var t = b.GetType();
                        var verProp = t.GetProperty("version") ?? t.GetProperty("Version");
                        if (verProp != null)
                        {
                            var v = verProp.GetValue(b);
                            if (v != null && int.TryParse(v.ToString(), out int vi)) return vi;
                        }
                    }
                    catch { }
                    return int.MinValue;
                })
                .ThenByDescending(b =>
                {
                    try
                    {
                        var t = b.GetType();
                        var dateProp = t.GetProperty("creationDate") ?? t.GetProperty("CreationDate") ?? t.GetProperty("file_date");
                        var dv = dateProp?.GetValue(b);
                        if (dv is DateTime dt) return dt;
                    }
                    catch { }
                    return DateTime.MinValue;
                })
                .ToList();

            return Ok(ordered);
        }

        [HttpPost("CreateBudget")]
        public async Task<IActionResult> CreateBudget([FromBody] CreateBudgetRequest request)
        {
            // Log del payload recibido para debug (compara con lo que el frontend imprime)
            Console.WriteLine("CreateBudget endpoint - payload recibido:");
            try
            {
                Console.WriteLine(JsonSerializer.Serialize(request, new JsonSerializerOptions { WriteIndented = true }));
            }
            catch { Console.WriteLine("No se pudo serializar request para log."); }

            // Log de la plantilla que Mongo espera (para comparar)
            var expectedTemplate = new
            {
                Budget = new {
                    budgetId = "string",
                    user = new { name = "string", lastName = "string", mail = "string" },
                    customer = new { name = "string", lastname = "string", tel = "string", mail = "string", address = "string", dni = "string" },
                    agent = new { name = "string", lastname = "string", dni = "string", tel = "string", mail = "string" },
                    workPlace = new { name = "string", location = "string", address = "string", workType = new { type = "string" } },
                    Products = new[] { new { OpeningType = new { name = "string" }, AlumTreatment = new { name = "string" }, GlassType = new { name = "string", Price = 0 }, width = 0, height = 0, WidthPanelQuantity = 0, HeightPanelQuantity = 0, PanelWidth = 0, PanelHeight = 0, Quantity = 0, Accesory = new object[] { }, price = 0 } },
                    complement = new[] { new { ComplementDoor = new object[] { }, ComplementRailing = new object[] { }, ComplementPartition = new object[] { }, price = 0 } },
                    Comment = "string",
                    DollarReference = 0,
                    LabourReference = 0
                }
            };
            Console.WriteLine("CreateBudget endpoint - plantilla esperada por Mongo (ejemplo):");
            Console.WriteLine(JsonSerializer.Serialize(expectedTemplate, new JsonSerializerOptions { WriteIndented = true }));

            if (request == null || request.Budget == null || request.Budget.Products == null)
                return BadRequest("Datos inválidos.");

            // Validar que venga el comentario si es requerido
            // if (string.IsNullOrEmpty(request.Budget.Comment)) return BadRequest("Falta el comentario.");

            // Mapear el DTO a un DTO que el servicio pueda usar (si es necesario)
            var budgetDTO = _mapper.Map<CreateBudgetDTO>(request.Budget);

            var command = new CreateBudgetCommand(budgetDTO);

            var budgetId = await _mediator.Send(command);

            return Ok("Presupuesto creado correctamente.");
        }


        [HttpGet("GetBudgetByBudgetId/{budgetId}")]
        public async Task<IActionResult> GetBudgetByBudgetId(string budgetId)
        {
            var query = new GetBudgetByBudgetIdQuery(budgetId);
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound("Presupuesto no encontrado.");

            return Ok(result);
        }

        [HttpGet("GetBudgetByCustomerDni/{customerDni}")]
        public async Task<IActionResult> GetBudgetByCustomerDni(string customerDni)
        {
            var query = new GetBudgetByCustomerDniQuery(customerDni);
            var result = await _mediator.Send(query);
            return Ok(result);
        }


        [HttpDelete("DeleteBudget")]
        public async Task<IActionResult> DeleteBudget([FromBody] string id)
        {
            var command = new DeleteBudgetCommand(id);
            return Ok("Cotización con ID:" + id + ", eliminada correctamente");
        }

        [HttpGet("GetAllBudgets")]
        public async Task<IActionResult> GetAllBudgets()
        {
            var budgets = await _budgetService.GetAllBudgetsAsync();
            return Ok(budgets);
        }

        [HttpGet("GetAllBudgetsWithComplements")]
        public async Task<IActionResult> GetAllBudgetsWithComplements([FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            // Validar parámetros
            if (from == default || to == default) return BadRequest("Debe proporcionar desde (from) y hasta (to).");
            if (from > to) return BadRequest("El parámetro 'from' no puede ser posterior a 'to'.");

            var query = new GetAllBudgetByComplementQuery
            {
                FromDate = from,
                ToDate = to
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }


        [HttpGet("GetBudgetsByPeriod")]
        public async Task<IActionResult> GetBudgetsByPeriod([FromQuery] string from, [FromQuery] string to)
        {
            if (string.IsNullOrEmpty(from) || string.IsNullOrEmpty(to))
                return BadRequest("Debe especificar las fechas 'from' y 'to'.");

            DateTime desde, hasta;
            if (!DateTime.TryParse(from, out desde) || !DateTime.TryParse(to, out hasta))
                return BadRequest("Formato de fecha inválido.");

            var allBudgets = await _budgetService.GetAllBudgetsAsync();
            // Filtra por fecha de creación y estado rechazado
            var filtered = allBudgets.Where(b =>
                (b.creationDate >= desde && b.creationDate <= hasta) &&
                (b.status == Domain.Enums.BudgetStatus.Rejected)
            ).ToList();

            return Ok(filtered);
        }


    }
}