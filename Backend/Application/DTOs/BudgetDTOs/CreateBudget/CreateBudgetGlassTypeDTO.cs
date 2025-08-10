using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetGlassTypeDTO
    {
        public required string name { get; set; } // Nombre del tipo de vidrio
        public decimal Price { get; set; } // Precio del tipo de vidrio
    }
}
