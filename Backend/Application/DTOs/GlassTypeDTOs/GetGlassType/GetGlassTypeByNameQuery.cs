using MediatR;
using System.Collections.Generic;

namespace Application.DTOs.GlassTypeDTOs.GetGlassType
{
    public record GetGlassTypeByNameQuery(string name) : IRequest<IEnumerable<GetGlassTypeDTO>>;
}
