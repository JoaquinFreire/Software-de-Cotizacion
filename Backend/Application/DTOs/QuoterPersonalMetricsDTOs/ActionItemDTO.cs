
namespace Application.DTOs.QuoterPersonalMetricsDTOs
{
    public class ActionItemDTO
    {
        public string Action { get; set; }
        public string Priority { get; set; } // "Alta", "Media", "Baja"
        public string DueDate { get; set; }
        public string Impact { get; set; } // "Alto", "Medio", "Bajo"
    }
}