using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.GetBudget
{
    public class GetBudgetByIdGlassTypeDTO
    {
        public string name { get; set; } // Nombre del tipo de vidrio
        public decimal price { get; set; } // Precio del tipo de vidrio
    }
}
