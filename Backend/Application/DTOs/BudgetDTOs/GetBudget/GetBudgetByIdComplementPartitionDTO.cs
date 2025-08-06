using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.GetBudget
{
    public class GetBudgetByIdComplementPartitionDTO
    {
        public string Name { get; set; } // Nombre del complemento
        public double Height { get; set; } // Alto del complemento
        public int Quantity { get; set; } // Cantidad del complemento
        public bool Simple { get; set; } // Simple o doble
        public GlassMilimeters GlassMilimeters { get; set; } // Milimetraje del vidrio
        public decimal Price { get; set; } // Precio del complemento

    }
}
