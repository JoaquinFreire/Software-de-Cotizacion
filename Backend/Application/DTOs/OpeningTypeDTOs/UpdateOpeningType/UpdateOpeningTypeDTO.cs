namespace Application.DTOs.OpeningTypeDTOs.UpdateOpeningType
{
    public class UpdateOpeningTypeDTO
    {
        public required string name { get; set; }
        public required double weight { get; set; }
        public required double predefined_size { get; set; }
    }
}
