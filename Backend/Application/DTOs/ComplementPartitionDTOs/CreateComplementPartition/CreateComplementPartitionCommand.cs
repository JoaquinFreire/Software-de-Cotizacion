using MediatR;

namespace Application.DTOs.ComplementPartitionDTOs.CreateComplementPartition
{
    public class CreateComplementPartitionCommand : IRequest<Unit>
    {
        public required CreateComplementPartitionDTO createComplementPartitionDTO { get; set; }
    }
}
