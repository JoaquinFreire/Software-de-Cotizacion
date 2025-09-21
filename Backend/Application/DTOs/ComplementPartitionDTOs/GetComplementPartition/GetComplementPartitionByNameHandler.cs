using MediatR;
using Domain.Repositories;
using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.DTOs.ComplementPartitionDTOs.GetComplementPartition
{
    public class GetComplementPartitionByNameHandler : IRequestHandler<GetComplementPartitionByNameQuery, IEnumerable<GetComplementPartitionDTO>>
    {
        private readonly IComplementPartitionRepository _repository;
        private readonly IMapper _mapper;

        public GetComplementPartitionByNameHandler(IComplementPartitionRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GetComplementPartitionDTO>> Handle(GetComplementPartitionByNameQuery request, CancellationToken cancellationToken)
        {
            var entities = await _repository.SearchByNameAsync(request.name);
            if (entities == null || !entities.Any()) return Enumerable.Empty<GetComplementPartitionDTO>();
            return _mapper.Map<IEnumerable<GetComplementPartitionDTO>>(entities);
        }
    }
}
