using Domain.Entities;
using Domain.Repositories;

namespace Application.Services
{
    public class AlumTreatmentServices
    {
        private readonly IAlumTreatmentRepository _repository;
        public AlumTreatmentServices(IAlumTreatmentRepository repository)
        {
            _repository = repository;
        }
            public async Task<IEnumerable<AlumTreatment>> GetAllAsync()
            {
            return await _repository.GetAllAsync();
            }
            public async Task<AlumTreatment?> GetByIdAsync(int id) 
            {
                return await _repository.GetByIdAsync(id) ?? throw new KeyNotFoundException($"AlumTreatment with id {id} not found.");
            }
            public Task AddAsync(AlumTreatment treatment) 
            {
            return _repository.AddAsync(treatment) ?? throw new ArgumentNullException(nameof(treatment), "AlumTreatment cannot be null.");
            }
            public  Task UpdateAsync(AlumTreatment treatment)  
            {
                return _repository.UpdateAsync(treatment) ?? throw new ArgumentNullException(nameof(treatment), "AlumTreatment cannot be null.");
            }
            public Task DeleteAsync(int id) 
            {
            return _repository.DeleteAsync(id) ?? throw new KeyNotFoundException($"AlumTreatment with id {id} not found.");
            }

    }
}
