using Application.DTOs;
using Domain.Repositories;

namespace Application.UseCases.AlumTreatment
{
    public class GetAllAlumTreatments
    {
        private readonly IAlumTreatmentRepository _repository;

        public GetAllAlumTreatments(IAlumTreatmentRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<AlumTreatmentDTO>> ExecuteAsync()
        {
            var entities = await _repository.GetAllAsync();

            return entities.Select(at => new AlumTreatmentDTO
            {
                name = at.name,
                pricePercentage = at.pricePercentage
            });
        }
    }
}
