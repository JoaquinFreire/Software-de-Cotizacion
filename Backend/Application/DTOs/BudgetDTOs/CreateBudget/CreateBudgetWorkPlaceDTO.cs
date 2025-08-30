using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetWorkPlaceDTO
    {
        public required string name { get; set; }
        public required string location { get; set; }
        public required string address { get; set; }
        public CreateBudgetWorkTypeDTO? workType { get; set; }
    }
}
