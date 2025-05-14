using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CreateBudget
{
    public class CreateBudgetCustomerDTO
    {
        public string? name { get; set; }
        public string? lastname { get; set; }
        public string? tel { get; set; }
        public string? mail { get; set; }
        public string? address { get; set; }
        public string? dni { get; set; }
        public CreateBudgetCustomerAgentDTO? agent { get; set; }
    }
}
