
namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class ProductEfficiencyDTO
    {
        public string OpeningType { get; set; }
        public int TotalQuotations { get; set; }
        public int Accepted { get; set; }
        public decimal ConversionRate { get; set; }
        public decimal AverageValue { get; set; }
        public string Performance { get; set; } // "Excelente", "Buena", "Regular"
    }
}
