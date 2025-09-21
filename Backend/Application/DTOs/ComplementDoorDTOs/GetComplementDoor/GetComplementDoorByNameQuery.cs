using MediatR;
using System.Collections.Generic;

namespace Application.DTOs.ComplementDoorDTOs.GetComplementDoor
{
    public record GetComplementDoorByNameQuery(string name) : IRequest<IEnumerable<GetComplementDoorDTO>>;
}
