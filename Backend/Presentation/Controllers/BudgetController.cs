using Application.Services;
using Application.DTOs.CreateBudget;
using Application.UseCases;
using Microsoft.AspNetCore.Mvc;
using Presentation.Request;
using AutoMapper;
using MediatR;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/Mongo")]
    public class BudgetController : ControllerBase
    {
        private readonly BudgetServices _budgetService;
        private readonly IBudgetPdfGenerator _pdfGenerator;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;

        public BudgetController(BudgetServices budgetService, IBudgetPdfGenerator pdfGenerator, IMapper mapper, IMediator mediator)
        {
            _budgetService = budgetService;
            _pdfGenerator = pdfGenerator;
            _mapper = mapper;
            _mediator = mediator;
        }

        [HttpPost("CreateBudget")]
        public async Task<IActionResult> CreateBudget([FromBody] CreateBudgetRequest request)
        {
            if (request == null || request.Budget == null || request.Budget.Products == null)
                return BadRequest("Datos inválidos.");

            // Mapear el DTO a un DTO que el servicio pueda usar (si es necesario)
            var budgetDTO = _mapper.Map<CreateBudgetDTO>(request.Budget);

            var command = new CreateBudgetCommand(budgetDTO);

            var budgetId = await _mediator.Send(command);

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

        //[HttpPost("GenerarPdf")]
        //public IActionResult GenerarPdf([FromBody] BudgetDTO budgetDTO)
        //{
        //    var pdfBytes = _pdfGenerator.Execute(budgetDTO);
        //    return File(pdfBytes, "application/pdf", "Presupuesto.pdf");
        //}

        // Generar PDF
        //var pdfBytes = _pdfGenerator.Execute(request.Budget);
        //return File(pdfBytes, "application/pdf", "Presupuesto.pdf");

    }
}