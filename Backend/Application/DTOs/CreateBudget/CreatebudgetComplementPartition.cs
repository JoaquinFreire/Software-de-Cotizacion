using Application.Enums;

namespace Application.DTOs.CreateBudget
{
    public class CreatebudgetComplementPartition
    {
        public required string name { get; set; } // Nombre de la partición
        public required double height { get; set; } // Altura de la partición
        public int quantity { get; set; }
        public bool simple { get; set; } // Indica si la partición es simple o doble
        public GlassMilimeters GlassMilimeters { get; set; } = GlassMilimeters.Mm6; // Espesor del vidrio
        //Propiedad de Color interno
        //Propiedad de Color externo
        public List<CreateBudgetAccesoryDTO> Accesory { get; set; } = new List<CreateBudgetAccesoryDTO>();
        public required decimal Price { get; set; } // Precio de la partición
    }
}
