
namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetProductDTO
    {
        public CreateBudgetOpeningTypeDTO? OpeningType { get; set; }
        public CreateBudgetAlumTreatmentDTO? AlumTreatment { get; set; }
        public CreateBudgetGlassTypeDTO? GlassType { get; set; }
        public double? width { get; set; }
        public double? height { get; set; }
        public required int WidthPanelQuantity { get; set; } // Cantidad de paneles en ancho
        public required int HeightPanelQuantity { get; set; } // Cantidad de paneles en alto
        public required double PanelWidth { get; set; } // Ancho de cada panel
        public required double PanelHeight { get; set; } // Alto de cada panel
        public int? Quantity { get; set; }
        public List<CreateBudgetAccesoryDTO> Accesory { get; set; } = new List<CreateBudgetAccesoryDTO>();
        public decimal? price { get; set; } // Precio unitario del producto
    }
}
