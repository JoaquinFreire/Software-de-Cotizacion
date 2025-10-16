using Application.DTOs.OperativeEfficiencyDashboard;
using Application.DTOs.OperativeEfficiencyDashboard.Alerts;
using Application.DTOs.OperativeEfficiencyDashboard.DashboardKpis;
using Application.DTOs.OperativeEfficiencyDashboard.ProblematicQuotation;
using Application.DTOs.OperativeEfficiencyDashboard.Workload;
using Application.Services;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/OED")]
    public class OperativeEfficiencyDashboardController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly DashboardDataService _dashboardDataService;

        public OperativeEfficiencyDashboardController(
            IMediator mediator,
            DashboardDataService dashboardDataService)
        {
            _mediator = mediator;
            _dashboardDataService = dashboardDataService;
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

        [HttpGet("dashboard-unified")]
        public async Task<ActionResult<DashboardResponse>> GetDashboardUnified([FromQuery] string timeRange = "30d")
        {
            try
            {
                Console.WriteLine("Iniciando carga del dashboard unificado...");
                var stopwatch = System.Diagnostics.Stopwatch.StartNew();

                var dashboardData = await _dashboardDataService.GetDashboardDataAsync();

                var kpisTask = _mediator.Send(new GetDashboardKpisQuery
                {
                    TimeRange = timeRange,
                    DashboardData = dashboardData
                });

                var workloadTask = _mediator.Send(new GetWorkloadQuery
                {
                    TimeRange = timeRange,
                    DashboardData = dashboardData
                });

                var alertsTask = _mediator.Send(new GetAlertsQuery
                {
                    TimeRange = timeRange,
                    Level = "all",
                    DashboardData = dashboardData
                });

                var problematicTask = _mediator.Send(new GetProblematicQuotationQuery
                {
                    TimeRange = timeRange,
                    DashboardData = dashboardData
                });

                await Task.WhenAll(kpisTask, workloadTask, alertsTask, problematicTask);

                stopwatch.Stop();
                Console.WriteLine($"✅ Dashboard unificado cargado en: {stopwatch.ElapsedMilliseconds}ms");

                return new DashboardResponse
                {
                    Kpis = kpisTask.Result,
                    Workload = workloadTask.Result,
                    Alerts = alertsTask.Result,
                    ProblematicQuotations = problematicTask.Result
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error cargando dashboard unificado: {ex.Message}");
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }
    }

    public class DashboardResponse
    {
        public DashboardKpisDTO Kpis { get; set; }
        public List<WorkloadDTO> Workload { get; set; }
        public List<AlertDTO> Alerts { get; set; }
        public List<ProblematicQuotationDTO> ProblematicQuotations { get; set; }
    }
}