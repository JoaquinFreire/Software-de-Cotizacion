using Application.DTOs.QuoterPersonalMetricsDTOs;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/QuoterPersonalMetrics")]
    public class QuoterPersonalMetricsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public QuoterPersonalMetricsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("metrics")]
        public async Task<ActionResult<QuoterPersonalMetricsDTO>> GetPersonalMetrics(
            [FromQuery] int quoterId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? metricType = null)
        {
            try
            {
                var query = new QuoterPersonalMetricsQuery
                {
                    QuoterId = quoterId,
                    FromDate = fromDate,
                    ToDate = toDate,
                    MetricType = metricType
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [HttpGet("metrics/summary")]
        public async Task<ActionResult<PerformanceSummaryDTO>> GetPerformanceSummary(
            [FromQuery] int quoterId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = new QuoterPersonalMetricsQuery
                {
                    QuoterId = quoterId,
                    FromDate = fromDate,
                    ToDate = toDate
                };

                var fullMetrics = await _mediator.Send(query);
                return Ok(fullMetrics.PerformanceSummary);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [HttpGet("metrics/key-metrics")]
        public async Task<ActionResult<KeyMetricsDTO>> GetKeyMetrics(
            [FromQuery] int quoterId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = new QuoterPersonalMetricsQuery
                {
                    QuoterId = quoterId,
                    FromDate = fromDate,
                    ToDate = toDate
                };

                var fullMetrics = await _mediator.Send(query);
                return Ok(fullMetrics.KeyMetrics);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [HttpGet("metrics/monthly-trends")]
        public async Task<ActionResult<List<MonthlyPerformanceDTO>>> GetMonthlyTrends(
            [FromQuery] int quoterId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = new QuoterPersonalMetricsQuery
                {
                    QuoterId = quoterId,
                    FromDate = fromDate,
                    ToDate = toDate
                };

                var fullMetrics = await _mediator.Send(query);
                return Ok(fullMetrics.MonthlyTrends);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [HttpGet("metrics/product-efficiency")]
        public async Task<ActionResult<List<ProductEfficiencyDTO>>> GetProductEfficiency(
            [FromQuery] int quoterId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = new QuoterPersonalMetricsQuery
                {
                    QuoterId = quoterId,
                    FromDate = fromDate,
                    ToDate = toDate
                };

                var fullMetrics = await _mediator.Send(query);
                return Ok(fullMetrics.ProductEfficiency);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [HttpGet("metrics/client-highlights")]
        public async Task<ActionResult<ClientHighlightsDTO>> GetClientHighlights(
            [FromQuery] int quoterId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = new QuoterPersonalMetricsQuery
                {
                    QuoterId = quoterId,
                    FromDate = fromDate,
                    ToDate = toDate
                };

                var fullMetrics = await _mediator.Send(query);
                return Ok(fullMetrics.ClientHighlights);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [HttpGet("metrics/immediate-actions")]
        public async Task<ActionResult<List<ActionItemDTO>>> GetImmediateActions(
            [FromQuery] int quoterId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = new QuoterPersonalMetricsQuery
                {
                    QuoterId = quoterId,
                    FromDate = fromDate,
                    ToDate = toDate
                };

                var fullMetrics = await _mediator.Send(query);
                return Ok(fullMetrics.ImmediateActions);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }
    }
}