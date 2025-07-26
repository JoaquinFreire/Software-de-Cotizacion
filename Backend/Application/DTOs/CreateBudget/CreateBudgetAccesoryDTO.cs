using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.CreateBudget
{
    public class CreateBudgetAccesoryDTO
    {
        public string name { get; set; }
        public int quantity { get; set; }
        public decimal price { get; set; } // Precio unitario del accesorio
    }
}
