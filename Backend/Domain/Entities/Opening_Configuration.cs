namespace Domain.Entities
{
    public class Opening_Configuration
    {
        public int id { get; set; }
        public int opening_type_id { get; set; }
        public int min_width_mm { get; set; }
        public int max_width_mm { get; set; }
        public int min_height_mm { get; set; }
        public int max_height_mm { get; set; }
        public int num_panels_width { get; set; }
        public int num_panels_height { get; set; }

        // Relación con Opening_Type
        public Opening_Type Opening_Type { get; set; }
    }
}
