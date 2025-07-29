
using Domain.Enums;

namespace Application.DTOs.CreateBudget
{
    public class CreateBudgetComplementPartitionDTO
    {
        public required string name { get; set; } // Nombre de la partición
        public required double height { get; set; } // Altura de la partición
        public int quantity { get; set; }
        public bool simple { get; set; } // Indica si la partición es simple o doble
        public GlassMilimeters GlassMilimeters { get; set; } // Espesor del vidrio
        //Propiedad de Color interno
        //Propiedad de Color externo
        public required decimal price { get; set; } // Precio de la partición
    }
}
