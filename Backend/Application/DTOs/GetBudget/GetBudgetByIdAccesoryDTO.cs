using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.GetBudget
{
    public class GetBudgetByIdAccesoryDTO
    {
        public GetBudgetByIdComplementDTO Accesory { get; set; }
        public int? Quantity { get; set; }

    }
}
