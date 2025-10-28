namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class PerformanceSummaryDTO
    {
        public string QuoterName { get; set; }
        public string PerformanceTier { get; set; }
        public decimal OverallScore { get; set; }
        public string Strengths { get; set; }
        public string AreasForImprovement { get; set; }
        public int CurrentRank { get; set; }
        public int TotalQuoters { get; set; }
        public string Period { get; set; } // Nuevo campo para el periodo
    }

}