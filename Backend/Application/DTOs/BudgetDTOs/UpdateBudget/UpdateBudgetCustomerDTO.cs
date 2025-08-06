using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.UpdateBudget
{
    public class UpdateBudgetCustomerDTO
    {
        public string tel { get; set; }
        public string mail { get; set; }
        public string address { get; set; }
        public UpdateBudgetCustomerAgentDTO agent { get; set; }
    }
}
