using Application.Services;
using Application.DTOs;
using Microsoft.AspNetCore.Mvc;
using Presentation.Request;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/Mongo")]
    public class BudgetController : ControllerBase
    {
        private readonly BudgetServices _budgetService;

        public BudgetController(BudgetServices budgetService)
        {
            _budgetService = budgetService;
        }

        [HttpPost("CreateBudget")]
        public async Task<IActionResult> CreateBudget([FromBody] CreateBudgetRequest request)
        {
            if (request == null || request.Budget == null || request.Products == null)
                return BadRequest("Datos inválidos.");

            await _budgetService.CreateBudgetAsync(request.Budget, request.Products, request.Accesories);
            return Ok("Presupuesto creado correctamente.");
        }

        [HttpGet("Test")]
        public IActionResult Test()
        {
            return Ok("Funciona");
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