using Application.DTOs.BudgetDTOs.CreateBudget;
using Application.DTOs.BudgetDTOs.GetBudget;
using Application.Services;
using Application.UseCases;
using Application.UseCases.Budget;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Presentation.Request;

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


        [HttpDelete("DeleteBudget")]
        public async Task<IActionResult> DeleteBudget([FromBody] string id)
        {
            await _budgetService.DeleteBudgetAsync(id);
            return Ok("Cotización eliminada correctamente");
        }

        [HttpGet("GetAllBudgets")]
        public async Task<IActionResult> GetAllBudgets()
        {
            var budgets = await _budgetService.GetAllBudgetsAsync();
            return Ok(budgets);
        }

    }
}