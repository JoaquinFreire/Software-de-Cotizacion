using MediatR;
using System.Collections.Generic;

namespace Application.DTOs.ComplementPartitionDTOs.GetComplementPartition
{
    public record GetComplementPartitionByNameQuery(string name) : IRequest<IEnumerable<GetComplementPartitionDTO>>;
}
