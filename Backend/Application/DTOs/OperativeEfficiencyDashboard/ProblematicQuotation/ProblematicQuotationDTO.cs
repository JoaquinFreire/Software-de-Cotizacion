namespace Application.DTOs.OperativeEfficiencyDashboard.ProblematicQuotation
{
    public class ProblematicQuotationDTO
    {
        public string QuotationId { get; set; } = string.Empty;
        public string Assignee { get; set; } = string.Empty;
        public int AssigneeId { get; set; }
        public int DaysWithoutEdit { get; set; }
        public int VersionCount { get; set; }
        public string CurrentStatus { get; set; } = string.Empty;
        public DateTime CreationDate { get; set; }
        public DateTime LastEditDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string WorkPlace { get; set; } = string.Empty;
        public string AlertLevel { get; set; } = string.Empty; // "red", "yellow", "green"
    }
}
