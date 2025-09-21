using MediatR;
using Domain.Repositories;
using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.DTOs.GlassTypeDTOs.GetGlassType
{
    public class GetGlassTypeByNameHandler : IRequestHandler<GetGlassTypeByNameQuery, IEnumerable<GetGlassTypeDTO>>
    {
        private readonly IGlassTypeRepository _repository;
        private readonly IMapper _mapper;

        public GetGlassTypeByNameHandler(IGlassTypeRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GetGlassTypeDTO>> Handle(GetGlassTypeByNameQuery request, CancellationToken cancellationToken)
        {
            var entities = await _repository.SearchByNameAsync(request.name);
            if (entities == null || !entities.Any()) return Enumerable.Empty<GetGlassTypeDTO>();
            return _mapper.Map<IEnumerable<GetGlassTypeDTO>>(entities);
        }
    }
}
