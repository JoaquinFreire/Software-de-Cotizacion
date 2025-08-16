using MediatR;

namespace Application.DTOs.ComplementPartitionDTOs.GetComplementPartition
{
    public record GetComplementPartitionQuery(int Id) : IRequest<GetComplementPartitionDTO>
    {
    }
}
