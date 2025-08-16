using AutoMapper;
using MediatR;
using Application.Services;


namespace Application.DTOs.ComplementPartitionDTOs.UpdateComplementPartition
{
    public class UpdateComplementPartitionHandler : IRequestHandler<UpdateComplementPartitionCommand, Unit>
    {
        private readonly ComplementPartitionServices _services;
        private readonly IMapper _mapper;
        public UpdateComplementPartitionHandler(ComplementPartitionServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(UpdateComplementPartitionCommand request, CancellationToken cancellationToken)
        {
            var complementPartition = await _services.GetByIdAsync(request.Id);
            if (complementPartition == null) throw new KeyNotFoundException($"Complement Partition with ID {request.Id} not found.");
            _mapper.Map(request.updateComplementPartitionDTO, complementPartition);
            await _services.UpdateAsync(complementPartition);
            return Unit.Value;
        }
    }
}
