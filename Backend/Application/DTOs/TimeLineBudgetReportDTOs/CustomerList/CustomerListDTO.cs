
namespace Application.DTOs.TimeLineBudgetReportDTOs.CustomerList
{
    public class CustomerListDTO
    {
        public int id { get; set; }
        public string name { get; set; } = string.Empty;
        public string lastname { get; set; } = string.Empty;
        public string dni { get; set; } = string.Empty;
        public string mail { get; set; } = string.Empty;
        public int TotalQuotations { get; set; }
        public int AcceptedQuotations { get; set; }
        public int PendingQuotations { get; set; }
        public int RejectedQuotations { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime LastQuotationDate { get; set; }
        public string PredominantStatus { get; set; } = string.Empty;
    }
}
