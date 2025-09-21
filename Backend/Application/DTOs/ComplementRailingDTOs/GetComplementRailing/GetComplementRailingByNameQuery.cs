using MediatR;
using System.Collections.Generic;

namespace Application.DTOs.ComplementRailingDTOs.GetComplementRailing
{
    public record GetComplementRailingByNameQuery(string name) : IRequest<IEnumerable<GetComplementRailingDTO>>;
}
