using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CreateBudget
{
    public class CreateBudgetAccesoryDTO
    {
        public CreateBudgetComplementDTO? Accesory { get; set; }
        public int? Quantity { get; set; }
    }
}
