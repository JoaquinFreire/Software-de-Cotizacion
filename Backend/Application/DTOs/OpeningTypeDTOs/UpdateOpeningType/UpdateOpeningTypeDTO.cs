namespace Application.DTOs.OpeningTypeDTOs.UpdateOpeningType
{
    public class UpdateOpeningTypeDTO
    {
        public required string name { get; set; }
        public required double weight { get; set; }
        public required double predefined_size { get; set; }

        // Url de la imagen (opcional) que puede ser seteada por el controlador tras subir a Cloudinary
        public string? image_url { get; set; }

        // Nueva propiedad description
        public required string description { get; set; }
    }
}
