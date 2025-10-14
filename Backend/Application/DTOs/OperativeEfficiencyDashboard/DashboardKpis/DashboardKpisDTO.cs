namespace Application.DTOs.OperativeEfficiencyDashboard.DashboardKpis
{
    public class DashboardKpisDTO
    {
        public int ActiveQuotations { get; set; }
        public int DelayedQuotations { get; set; }
        public decimal TeamEfficiency { get; set; }
        public int ActiveAlerts { get; set; }
        public Dictionary<string, string> Trends { get; set; } = new();
    }
}
