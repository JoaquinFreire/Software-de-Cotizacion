using Application.DTOs.BudgetDTOs.GetBudget;
using Application.DTOs.CustomerAgentDTOs.GetCustomerAgent; // <-- nuevo using

namespace Application.DTOs.CustomerDTOs.GetCustomer
{
    public class GetCustomerDTO
    {
        public int id { get; set; }
        public required string name { get; set; }
        public required string lastname { get; set; }
        public required string tel { get; set; }
        public required string mail { get; set; }
        public required string address { get; set; }
        public required string dni { get; set; }
        public required DateTime registration_date { get; set; }

        // Nueva propiedad: lista de agentes relacionados (puede ser vacía)
        public IEnumerable<GetCustomerAgentDTO>? agents { get; set; }
    }
}

