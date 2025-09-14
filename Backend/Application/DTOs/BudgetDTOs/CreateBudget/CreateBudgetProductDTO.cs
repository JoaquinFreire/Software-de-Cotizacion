
namespace Application.DTOs.BudgetDTOs.CreateBudget
{
    public class CreateBudgetProductDTO
    {
        public CreateBudgetOpeningTypeDTO? OpeningType { get; set; }
        public CreateBudgetAlumTreatmentDTO? AlumTreatment { get; set; }
        public CreateBudgetGlassTypeDTO? GlassType { get; set; }
        public double? width { get; set; }
        public double? height { get; set; }
        public int? Quantity { get; set; }
        public List<CreateBudgetAccesoryDTO> Accesory { get; set; } = new List<CreateBudgetAccesoryDTO>();
        public decimal? price { get; set; } // Precio unitario del producto
    }
}
