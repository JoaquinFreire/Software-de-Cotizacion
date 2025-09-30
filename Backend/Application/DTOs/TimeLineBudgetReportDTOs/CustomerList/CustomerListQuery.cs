using MediatR;

namespace Application.DTOs.TimeLineBudgetReportDTOs.CustomerList
{
    public class CustomerListQuery : IRequest<List<CustomerListDTO>>
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? StatusFilter { get; set; }
        public string? CustomerName { get; set; }
        public string? WorkPlaceName { get; set; }
        public string? ProductType { get; set; }
        public string? SearchTerm { get; set; }
    }
}
