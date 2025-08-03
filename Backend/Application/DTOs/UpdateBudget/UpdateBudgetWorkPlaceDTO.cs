using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.UpdateBudget
{
    public class UpdateBudgetWorkPlaceDTO
    {
        public string id { get; set; }
        public string name { get; set; }
        public string address { get; set; }
        public UpdateBudgetWorkTypeDTO workType { get; set; }
    }
}
