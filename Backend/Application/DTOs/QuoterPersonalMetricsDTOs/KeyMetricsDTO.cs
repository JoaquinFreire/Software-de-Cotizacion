
namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class KeyMetricsDTO
    {
        public int TotalQuotations { get; set; }
        public int AcceptedQuotations { get; set; }
        public int PendingQuotations { get; set; }
        public int RejectedQuotations { get; set; }
        public decimal ConversionRate { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageQuotationValue { get; set; }
        public double AverageResponseTimeHours { get; set; }
        public double AverageTimeToCloseDays { get; set; }
        public int ActiveClients { get; set; }
    }
}