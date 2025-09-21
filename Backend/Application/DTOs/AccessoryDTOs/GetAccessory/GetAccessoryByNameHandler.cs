using MediatR;
using Domain.Repositories;
using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.DTOs.AccessoryDTOs.GetAccessory
{
    public class GetAccessoryByNameHandler : IRequestHandler<GetAccessoryByNameQuery, IEnumerable<GetAccessoryDTO>>
    {
        private readonly IAccesoryRepository _repository;
        private readonly IMapper _mapper;

        public GetAccessoryByNameHandler(IAccesoryRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GetAccessoryDTO>> Handle(GetAccessoryByNameQuery request, CancellationToken cancellationToken)
        {
            var entities = await _repository.SearchByNameAsync(request.name);
            if (entities == null || !entities.Any()) return Enumerable.Empty<GetAccessoryDTO>();
            return _mapper.Map<IEnumerable<GetAccessoryDTO>>(entities);
        }
    }
}
