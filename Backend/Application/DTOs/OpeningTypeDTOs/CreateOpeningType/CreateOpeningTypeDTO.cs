namespace Application.DTOs.OpeningTypeDTOs.CreateOpeningType
{
    public class CreateOpeningTypeDTO
    {
        public required string name { get; set; }
        public required double weight { get; set; }
        public required double predefined_size { get; set; }
    }
}
