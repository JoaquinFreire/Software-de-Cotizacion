namespace Application.DTOs.OperativeEfficiencyDashboard.Workload
{
    public class WorkloadAlertsDTO
    {
        public string Active { get; set; } = "green"; // red, yellow, green
        public string Delayed { get; set; } = "green";
        public string Overall { get; set; } = "green";
    }
}
