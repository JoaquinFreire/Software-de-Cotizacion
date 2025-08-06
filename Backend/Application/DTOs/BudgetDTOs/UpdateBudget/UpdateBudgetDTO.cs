using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.UpdateBudget
{
    public class UpdateBudgetDTO
    {
        public string version { get; set; }
        public UpdateBudgetCustomerDTO customerDTO { get; set; }
        public UpdateBudgetWorkPlaceDTO workPlaceDTO { get; set; }
        public List<UpdateBudgetProductDTO> products { get; set; }
        //TODO: Agregar los complementos cuando estén implementados
        public string comment { get; set; }
        public double dollarReference { get; set; }
        public double labourReference { get; set; }
        public double total { get; set; }


    }
}
