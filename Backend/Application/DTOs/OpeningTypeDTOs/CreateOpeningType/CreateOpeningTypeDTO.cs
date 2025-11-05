namespace Application.DTOs.OpeningTypeDTOs.CreateOpeningType
{
    public class CreateOpeningTypeDTO
    {
        public required string name { get; set; }
        public required double weight { get; set; }
        public required double predefined_size { get; set; }

        // Nueva propiedad para almacenar la URL de la imagen (opcional)
        public string? image_url { get; set; }

        // Nueva propiedad description (pedida en crear/editar)
        public required string description { get; set; }
    }
}
