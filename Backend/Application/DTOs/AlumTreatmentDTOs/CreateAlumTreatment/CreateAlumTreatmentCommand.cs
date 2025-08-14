using MediatR;

namespace Application.DTOs.AlumTreatmentDTOs.CreateAlumTreatment
{
    public class CreateAlumTreatmentCommand : IRequest<string>
    {
        public CreateAlumTreatmentDTO alumTreatmentDTO { get; set; }
    }
}
