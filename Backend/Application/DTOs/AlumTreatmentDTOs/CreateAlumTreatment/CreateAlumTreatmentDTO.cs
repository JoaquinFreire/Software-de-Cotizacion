
namespace Application.DTOs.AlumTreatmentDTOs.CreateAlumTreatment
{
    public class CreateAlumTreatmentDTO
    {
        public required string name { get; set; }
        public int pricePercentage { get; set; }
        public string? description { get; set; }
    }
}
