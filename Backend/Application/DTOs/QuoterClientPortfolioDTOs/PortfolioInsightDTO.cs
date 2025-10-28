namespace Application.DTOs.QuoterClientPortfolioDTOs
{
    public class PortfolioInsightDTO
    {
        public string InsightType { get; set; } // "Oportunidad", "Riesgo", "Tendencia"
        public string Title { get; set; }
        public string Description { get; set; }
        public string Impact { get; set; } // "Alto", "Medio", "Bajo"
        public List<string> Actions { get; set; }
    }
}