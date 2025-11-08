
namespace Application.DTOs.GlassTypeDTOs.UpdateGlassType
{
    public class UpdateGlassTypeDTO
    {
        public required string name { get; set; }
        public decimal price { get; set; }
        public string? description { get; set; }
    }
}
