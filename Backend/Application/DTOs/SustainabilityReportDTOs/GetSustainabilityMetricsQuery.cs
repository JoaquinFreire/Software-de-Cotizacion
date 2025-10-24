using MediatR;

namespace Application.DTOs.SustainabilityReportDTOs
{
    public class GetSustainabilityMetricsQuery : IRequest<SustainabilityMetricsDTO>
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? TimeRange { get; set; } // "12M", "6M", "3M", "1M"
    }
}
