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
        public required string Name { get; set; } // Nombre del complemento
        public required double Height { get; set; } // Alto del complemento
        public required int Quantity { get; set; } // Cantidad del complemento
        public required bool Simple { get; set; } // Simple o doble
        public required GlassMilimeters GlassMilimeters { get; set; } // Milimetraje del vidrio
        public decimal Price { get; set; } // Precio del complemento

    }
}
