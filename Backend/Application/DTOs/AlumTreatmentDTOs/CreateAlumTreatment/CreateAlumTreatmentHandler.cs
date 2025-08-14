using MediatR;
using Domain.Repositories;
using Domain.Entities;
using AutoMapper;


namespace Application.DTOs.AlumTreatmentDTOs.CreateAlumTreatment
{
    public class CreateAlumTreatmentHandler : IRequestHandler<CreateAlumTreatmentCommand, string>
    {
        private readonly IAlumTreatmentRepository _repository;
        private readonly IMapper _mapper;
        public CreateAlumTreatmentHandler(IAlumTreatmentRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }
        public async Task<string> Handle(CreateAlumTreatmentCommand request, CancellationToken cancellationToken)
        {
            var alumTreatment = _mapper.Map<AlumTreatment>(request.alumTreatmentDTO);
            await _repository.AddAsync(alumTreatment);
            return alumTreatment.id.ToString(); // Devuelve el id del tratamiento de alumbre creado

        }
    }
}
