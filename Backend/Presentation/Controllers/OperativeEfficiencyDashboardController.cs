using Application.DTOs.OperativeEfficiencyDashboard.Alerts;
using Application.DTOs.OperativeEfficiencyDashboard.DashboardKpis;
using Application.DTOs.OperativeEfficiencyDashboard.ProblematicQuotation;
using Application.DTOs.OperativeEfficiencyDashboard.Workload;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/OED")]
    public class OperativeEfficiencyDashboardController : ControllerBase
    {
        private readonly IMediator _mediator;

        public OperativeEfficiencyDashboardController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("kpis")]
        public async Task<ActionResult<DashboardKpisDTO>> GetKpis([FromQuery] string timeRange = "30d")
        {
            var query = new GetDashboardKpisQuery { TimeRange = timeRange };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("workload")]
        public async Task<ActionResult<List<WorkloadDTO>>> GetWorkload([FromQuery] string timeRange = "30d")
        {
            var query = new GetWorkloadQuery { TimeRange = timeRange };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("alerts")]
        public async Task<ActionResult<List<AlertDTO>>> GetAlerts(
            [FromQuery] string? level = null,
            [FromQuery] string timeRange = "30d")
        {
            var query = new GetAlertsQuery { Level = level, TimeRange = timeRange };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("problematic-quotations")]
        public async Task<ActionResult<List<ProblematicQuotationDTO>>> GetProblematicQuotations([FromQuery] string timeRange = "30d")
        {
            var query = new GetProblematicQuotationQuery { TimeRange = timeRange };
            var result = await _mediator.Send(query);
            return Ok(result);
        }
    }
}
