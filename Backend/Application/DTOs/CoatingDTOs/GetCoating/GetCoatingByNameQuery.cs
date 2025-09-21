using MediatR;
using System.Collections.Generic;

namespace Application.DTOs.CoatingDTOs.GetCoating
{
    public record GetCoatingByNameQuery(string name) : IRequest<IEnumerable<GetCoatingDTO>>;
}
