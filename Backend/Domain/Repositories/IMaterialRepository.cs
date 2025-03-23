using Domain.Entities;

namespace Domain.Repositories;

public interface IMaterialRepository
{
    Task<IEnumerable<Material>> GetAllAsync();
    Task<Material?> GetByIdAsync(int id);
    Task AddAsync(Material material);
    Task UpdateAsync(Material material);
    Task DeleteAsync(int id);
}
