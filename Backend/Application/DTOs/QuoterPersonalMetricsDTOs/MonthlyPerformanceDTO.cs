
namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class MonthlyPerformanceDTO
    {
        public string Month { get; set; }
        public int Quotations { get; set; }
        public int Accepted { get; set; }
        public decimal ConversionRate { get; set; }
        public decimal Revenue { get; set; }
        public string Trend { get; set; } // "up", "down", "stable"
    }
}
