using MediatR;
using Domain.Repositories;
using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.DTOs.ComplementRailingDTOs.GetComplementRailing
{
    public class GetComplementRailingByNameHandler : IRequestHandler<GetComplementRailingByNameQuery, IEnumerable<GetComplementRailingDTO>>
    {
        private readonly IComplementRailingRepository _repository;
        private readonly IMapper _mapper;

        public GetComplementRailingByNameHandler(IComplementRailingRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GetComplementRailingDTO>> Handle(GetComplementRailingByNameQuery request, CancellationToken cancellationToken)
        {
            var entities = await _repository.SearchByNameAsync(request.name);
            if (entities == null || !entities.Any()) return Enumerable.Empty<GetComplementRailingDTO>();
            return _mapper.Map<IEnumerable<GetComplementRailingDTO>>(entities);
        }
    }
}
