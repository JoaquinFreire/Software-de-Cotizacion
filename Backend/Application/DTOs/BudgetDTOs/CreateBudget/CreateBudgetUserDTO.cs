using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetUserDTO
    {
        public string? name { get; set; }
        public string? lastName { get; set; }
        public string? mail { get; set; }
    }
}
