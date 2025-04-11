using Application.Services;
using Application.DTOs;
using Application.UseCases;
using Microsoft.AspNetCore.Mvc;
using Presentation.Request;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/Mongo")]
    public class BudgetController : ControllerBase
    {
        private readonly BudgetServices _budgetService;
        private readonly IBudgetPdfGenerator _pdfGenerator;

        public BudgetController(BudgetServices budgetService, IBudgetPdfGenerator pdfGenerator)
        {
            _budgetService = budgetService;
            _pdfGenerator = pdfGenerator;
        }

        [HttpPost("CreateBudget")]
        public async Task<IActionResult> CreateBudget([FromBody] CreateBudgetRequest request)
        {
            if (request == null || request.Budget == null || request.Budget.Products == null)
                return BadRequest("Datos inválidos.");

            await _budgetService.CreateBudgetAsync(request.Budget);
            //return Ok("Presupuesto creado correctamente.");

            // Generar PDF
            var pdfBytes = _pdfGenerator.Execute(request.Budget);
            return File(pdfBytes, "application/pdf", "Presupuesto.pdf");
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

        [HttpPost("GenerarPdf")]
        public IActionResult GenerarPdf([FromBody] BudgetDTO budgetDTO)
        {
            var pdfBytes = _pdfGenerator.Execute(budgetDTO);
            return File(pdfBytes, "application/pdf", "Presupuesto.pdf");
        }

    }
}