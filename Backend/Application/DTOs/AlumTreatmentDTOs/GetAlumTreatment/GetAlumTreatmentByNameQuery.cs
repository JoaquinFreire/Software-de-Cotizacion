using MediatR;
using System.Collections.Generic;

namespace Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment
{
    public record GetAlumTreatmentByNameQuery(string name) : IRequest<IEnumerable<GetAlumTreatmentDTO>>;
}
