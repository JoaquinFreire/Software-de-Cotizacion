using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetAccesoryDTO
    {
        public string Name { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; } // Precio unitario del accesorio
    }
}
