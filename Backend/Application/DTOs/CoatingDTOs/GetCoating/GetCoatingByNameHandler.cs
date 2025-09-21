using MediatR;
using Domain.Repositories;
using AutoMapper;
    using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.DTOs.CoatingDTOs.GetCoating
{
    public class GetCoatingByNameHandler : IRequestHandler<GetCoatingByNameQuery, IEnumerable<GetCoatingDTO>>
    {
        private readonly ICoatingRepository _repository;
        private readonly IMapper _mapper;

        public GetCoatingByNameHandler(ICoatingRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GetCoatingDTO>> Handle(GetCoatingByNameQuery request, CancellationToken cancellationToken)
        {
            var entities = await _repository.SearchByNameAsync(request.name);
            if (entities == null || !entities.Any()) return Enumerable.Empty<GetCoatingDTO>();
            return _mapper.Map<IEnumerable<GetCoatingDTO>>(entities);
        }
    }
}
