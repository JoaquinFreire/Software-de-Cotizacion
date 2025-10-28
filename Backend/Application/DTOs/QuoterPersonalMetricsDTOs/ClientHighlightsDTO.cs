namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class ClientHighlightsDTO
    {
        public int TotalClients { get; set; }
        public string TopClient { get; set; }
        public decimal TopClientRevenue { get; set; }
        public int RepeatClients { get; set; }
        public decimal RetentionRate { get; set; }
        public int NewClientsThisPeriod { get; set; }
    }
}