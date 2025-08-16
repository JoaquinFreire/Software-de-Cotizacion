using MediatR;
using AutoMapper;
using Application.Services;
using Domain.Entities;


namespace Application.DTOs.ComplementPartitionDTOs.CreateComplementPartition
{
    public class CreateComplementPartitionHandler : IRequestHandler<CreateComplementPartitionCommand, Unit>
    {
        private readonly ComplementPartitionServices _services;
        private readonly IMapper _mapper;

        public CreateComplementPartitionHandler(ComplementPartitionServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<Unit> Handle(CreateComplementPartitionCommand request, CancellationToken cancellationToken)
        {
            var complementPartition = _mapper.Map<ComplementPartition>(request.createComplementPartitionDTO);
            await _services.AddAsync(complementPartition);
            return Unit.Value;
        }
    }
}
