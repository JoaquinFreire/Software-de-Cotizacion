
namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class PerformanceSummaryDTO
    {
        public string QuoterName { get; set; }
        public string PerformanceTier { get; set; } // "Alto", "Medio", "Bajo"
        public decimal OverallScore { get; set; } // 0-100
        public string Strengths { get; set; }
        public string AreasForImprovement { get; set; }
        public int CurrentRank { get; set; } // Ranking en el equipo
        public int TotalQuoters { get; set; }
    }
}
