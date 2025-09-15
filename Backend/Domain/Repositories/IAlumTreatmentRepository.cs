using Domain.Entities;

namespace Domain.Repositories
{
    public interface IAlumTreatmentRepository
    {
        Task<IEnumerable<AlumTreatment>> GetAllAsync();
        Task<AlumTreatment?> GetByIdAsync(int id);
        Task<AlumTreatment?> GetByNameAsync(string name);
        Task AddAsync(AlumTreatment treatment);
        Task UpdateAsync(AlumTreatment treatment);
        Task DeleteAsync(int id);
    }
}
