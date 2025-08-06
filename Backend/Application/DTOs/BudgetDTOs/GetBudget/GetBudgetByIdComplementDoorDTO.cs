using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.BudgetDTOs.GetBudget
{
    public class GetBudgetByIdComplementDoorDTO
    {
        public string Name { get; set; } // Nombre del complemento
        public string Width { get; set; } // Ancho del complemento
        public string Height { get; set; } // Alto del complemento
        public GetBudgetByIdCoatingDTO Coating { get; set; } // Revestimiento del complemento
        public int Quantity { get; set; } // Cantidad del complemento
        public GetBudgetByIdAccesoryDTO Accessory { get; set; } // Accesorio del complemento
        public decimal Price { get; set; } // Precio del complemento
    }
}
