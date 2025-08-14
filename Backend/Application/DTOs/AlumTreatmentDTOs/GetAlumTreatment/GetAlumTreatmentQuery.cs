using MediatR;

namespace Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment
{
    public record GetAlumTreatmentQuery(int id) : IRequest<GetAlumTreatmentDTO>;
}
