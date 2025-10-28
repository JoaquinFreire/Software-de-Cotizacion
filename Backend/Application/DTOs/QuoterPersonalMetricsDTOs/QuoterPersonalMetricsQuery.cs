using MediatR;

namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class QuoterPersonalMetricsQuery : IRequest<QuoterPersonalMetricsDTO>
    {
        public int QuoterId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public DateTime? TrendsFromDate { get; set; }
        public DateTime? TrendsToDate { get; set; }
        public DateTime? ProductsFromDate { get; set; }
        public DateTime? ProductsToDate { get; set; }
        public string? MetricType { get; set; }
    }
}