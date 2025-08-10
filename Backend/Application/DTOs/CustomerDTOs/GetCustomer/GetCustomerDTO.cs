
using Application.DTOs.BudgetDTOs.GetBudget;

namespace Application.DTOs.CustomerDTOs.GetCustomer
{
    public class GetCustomerDTO
    {
        public required string name { get; set; }
        public required string lastname { get; set; }
        public required string tel { get; set; }
        public required string mail { get; set; }
        public required string address { get; set; }
        public required string dni { get; set; }
        public required DateTime registration_date { get; set; }
        public GetCustomerAgentDTO? agent { get; set; }

    }
}
