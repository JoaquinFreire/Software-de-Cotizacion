namespace Application.DTOs.OperativeEfficiencyDashboard.Workload
{
    public class WorkloadDTO
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public int ActiveQuotations { get; set; }
        public int PendingQuotations { get; set; }
        public int DelayedQuotations { get; set; }
        public decimal Efficiency { get; set; }
        public WorkloadAlertsDTO Alerts { get; set; } = new();
    }
}
