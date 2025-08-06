using Domain.Enums;

namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetComplementPartitionDTO
    {
        public required string Name { get; set; } // Nombre de la partición
        public required double Height { get; set; } // Altura de la partición
        public int Quantity { get; set; }
        public bool Simple { get; set; } // Indica si la partición es simple o doble
        public GlassMilimeters GlassMilimeters { get; set; } // Espesor del vidrio
        //Propiedad de Color interno
        //Propiedad de Color externo
        public required decimal Price { get; set; } // Precio de la partición
    }
}
