using Application.DTOs.SustainabilityReportDTOs;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/SustainabilityReport")]
    public class SustainabilityReportController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SustainabilityReportController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("metrics")]
        public async Task<ActionResult<SustainabilityMetricsDTO>> GetSustainabilityMetrics(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] string? timeRange = "12M")
        {
            var query = new GetSustainabilityMetricsQuery
            {
                FromDate = fromDate,
                ToDate = toDate,
                TimeRange = timeRange
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }
    }
}