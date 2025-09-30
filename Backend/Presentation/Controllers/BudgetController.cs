using Application.DTOs.BudgetDTOs.CreateBudget;
using Application.DTOs.BudgetDTOs.GetBudget;
using Application.DTOs.BudgetDTOs.GetBudgetByCustomerDni;
using Application.DTOs.BudgetDTOs.DeleteBudget;
using Application.Services;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Presentation.Request;
using System.Text.Json; // <-- para serializar en consola

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

    }
}