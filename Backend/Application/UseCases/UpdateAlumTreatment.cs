using Application.DTOs;
using Domain.Repositories;

namespace Application.UseCases.AlumTreatment
{
    public class UpdateAlumTreatment
    {
        private readonly IAlumTreatmentRepository _repository;

        public UpdateAlumTreatment(IAlumTreatmentRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Execute(int id, AlumTreatmentDTO dto)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing is null) return false;

            existing.name = dto.name;
            existing.pricePercentage = dto.pricePercentage;

            await _repository.UpdateAsync(existing);
            return true;
        }
    }
}
