using MediatR;
using Domain.Repositories;
using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment
{
    public class GetAlumTreatmentByNameHandler : IRequestHandler<GetAlumTreatmentByNameQuery, IEnumerable<GetAlumTreatmentDTO>>
    {
        private readonly IAlumTreatmentRepository _repository;
        private readonly IMapper _mapper;

        public GetAlumTreatmentByNameHandler(IAlumTreatmentRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GetAlumTreatmentDTO>> Handle(GetAlumTreatmentByNameQuery request, CancellationToken cancellationToken)
        {
            var entities = await _repository.SearchByNameAsync(request.name);
            if (entities == null || !entities.Any()) return Enumerable.Empty<GetAlumTreatmentDTO>();
            return _mapper.Map<IEnumerable<GetAlumTreatmentDTO>>(entities);
        }
    }
}
