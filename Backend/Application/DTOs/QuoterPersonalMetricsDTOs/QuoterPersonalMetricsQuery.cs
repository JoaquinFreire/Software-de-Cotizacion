using MediatR;

namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class QuoterPersonalMetricsQuery : IRequest<QuoterPersonalMetricsDTO>
    {
        public int QuoterId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? MetricType { get; set; } // "general", "mensual", "por-producto"
    }
}
