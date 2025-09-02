namespace Application.DTOs.OpeningConfigurationDTOs.GetOpeningConfiguration
{
    public class GetOpeningConfigurationDTO
    {
        public int id { get; set; }
        public int opening_type_id { get; set; }
        public double min_width_mm { get; set; }
        public double max_width_mm { get; set; }
        public double min_height_mm { get; set; }
        public double max_height_mm { get; set; }
        public int num_panels_width { get; set; }
        public int num_panels_height { get; set; }
        public string? opening_type_name { get; set; }
    }
}
