using MediatR;
using Domain.Repositories;
using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.DTOs.ComplementDoorDTOs.GetComplementDoor
{
    public class GetComplementDoorByNameHandler : IRequestHandler<GetComplementDoorByNameQuery, IEnumerable<GetComplementDoorDTO>>
    {
        private readonly IComplementDoorRepository _repository;
        private readonly IMapper _mapper;

        public GetComplementDoorByNameHandler(IComplementDoorRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GetComplementDoorDTO>> Handle(GetComplementDoorByNameQuery request, CancellationToken cancellationToken)
        {
            var entities = await _repository.SearchByNameAsync(request.name);
            if (entities == null || !entities.Any()) return Enumerable.Empty<GetComplementDoorDTO>();
            return _mapper.Map<IEnumerable<GetComplementDoorDTO>>(entities);
        }
    }
}
