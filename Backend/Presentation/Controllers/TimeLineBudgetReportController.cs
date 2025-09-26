using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/TimeLineBudgetReport")]
    public class TimeLineBudgetReportController : Controller
    {
        private readonly IMediator _mediator;

        public TimeLineBudgetReportController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{budgetId}")]
        public async Task<IActionResult> GetTimeLineBudgetReport(string budgetId)
        {
            try
            {
                var query = new Application.DTOs.BudgetDTOs.TimeLineBudgetReport.TimeLineBudgetReportQuery(budgetId);
                var report = await _mediator.Send(query);
                return Ok(report);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                // Log the exception (ex) as needed
                return StatusCode(500, "Ocurrió un error interno en el servidor.");
            }
        }
    }
}
