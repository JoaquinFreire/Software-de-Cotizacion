using MediatR;
using AutoMapper;
using Application.Services;
using Application.DTOs.ComplementPartitionDTOs.GetComplementPartition;

namespace Application.DTOs.ComplementPartitionDTOs.GetComplementPartition
{
    public class GetComplementPartitionHandler : IRequestHandler<GetComplementPartitionQuery, GetComplementPartitionDTO>
    {
        private readonly ComplementPartitionServices _services;
        private readonly IMapper _mapper;
        public GetComplementPartitionHandler(ComplementPartitionServices services, IMapper mapper)
        {
            _services = services;
            _mapper = mapper;
        }
        public async Task<GetComplementPartitionDTO> Handle(GetComplementPartitionQuery request, CancellationToken cancellationToken)
        {
            var complementPartition = await _services.GetByIdAsync(request.Id);
            return _mapper.Map<GetComplementPartitionDTO>(complementPartition);
        }
    }
}
