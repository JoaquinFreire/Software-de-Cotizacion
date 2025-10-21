
namespace Application.DTOs.QuoterClientPortfolioDTOs
{
    public class PortfolioSummaryDTO
    {
        public int TotalClients { get; set; }
        public int ActiveClients { get; set; }
        public int AtRiskClients { get; set; }
        public int NewClients { get; set; }
        public decimal TotalPortfolioValue { get; set; }
        public decimal AverageClientValue { get; set; }
        public decimal PortfolioGrowthRate { get; set; }
        public string BestPerformingSegment { get; set; }
    }
}
