using MediatR;

namespace Application.DTOs.ComplementPartitionDTOs.UpdateComplementPartition
{
    public class UpdateComplementPartitionCommand : IRequest<Unit>
    {
        public int Id { get; set; }
        public required UpdateComplementPartitionDTO updateComplementPartitionDTO { get; set; }

    }
}
