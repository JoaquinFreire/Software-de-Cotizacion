using MediatR;

namespace Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment
{
    public record GetAlumTreatmentByNameQuery(string name) : IRequest<GetAlumTreatmentDTO?>;
}
