using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetCoating
    {
        public required string name { get; set; } // Nombre del revestimiento
        public decimal price { get; set; } // Precio del revestimiento
    }
}
