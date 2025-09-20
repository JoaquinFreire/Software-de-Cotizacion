using MediatR;
using Domain.Repositories;
using AutoMapper;

namespace Application.DTOs.AlumTreatmentDTOs.GetAlumTreatment
{
    public class GetAlumTreatmentByNameHandler : IRequestHandler<GetAlumTreatmentByNameQuery, GetAlumTreatmentDTO?>
    {
        private readonly IAlumTreatmentRepository _repository;
        private readonly IMapper _mapper;

        public GetAlumTreatmentByNameHandler(IAlumTreatmentRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<GetAlumTreatmentDTO?> Handle(GetAlumTreatmentByNameQuery request, CancellationToken cancellationToken)
        {
            var entity = await _repository.GetByNameAsync(request.name);
            if (entity == null) return null;
            var dto = _mapper.Map<GetAlumTreatmentDTO>(entity);
            return dto;
        }
    }
}
