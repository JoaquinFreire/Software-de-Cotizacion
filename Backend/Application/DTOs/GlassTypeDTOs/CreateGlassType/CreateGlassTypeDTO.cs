
namespace Application.DTOs.GlassTypeDTOs.CreateGlassType
{
    public class CreateGlassTypeDTO
    {
        public required string name { get; set; }
        public decimal price { get; set; }
        public string? description { get; set; }
    }
}
