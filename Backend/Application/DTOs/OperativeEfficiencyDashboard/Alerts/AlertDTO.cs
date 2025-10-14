namespace Application.DTOs.OperativeEfficiencyDashboard.Alerts
{
    public class AlertDTO
    {
        public string Level { get; set; } = string.Empty; // "red", "yellow", "green"
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Time { get; set; }
        public string Type { get; set; } = string.Empty; // "workload", "inactivity", "efficiency"
        public string? QuotationId { get; set; }
        public string Assignee { get; set; } = string.Empty;
        public int AssigneeId { get; set; }
        public int? DaysWithoutEdit { get; set; }
        public decimal? MetricValue { get; set; } // Valor numérico para ordenamiento
    }
}
