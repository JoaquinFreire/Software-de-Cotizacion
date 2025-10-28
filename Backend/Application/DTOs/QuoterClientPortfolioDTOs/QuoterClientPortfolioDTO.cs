namespace Application.DTOs.QuoterClientPortfolioDTOs
{
    public class QuoterClientPortfolioDTO
    {
        public PortfolioSummaryDTO Summary { get; set; }
        public List<ClientPortfolioItemDTO> Clients { get; set; }
        public List<PortfolioInsightDTO> Insights { get; set; }
    }
}