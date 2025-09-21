using Domain.Entities;

namespace Domain.Repositories
{
    public interface IGlassTypeRepository
    {
        Task<IEnumerable<GlassType>> GetAllAsync();
        Task<GlassType?> GetByIdAsync(int id);
        Task<GlassType?> GetByNameAsync(string name);
        Task<IEnumerable<GlassType>> SearchByNameAsync(string text);
        Task AddAsync(GlassType glassType);
        Task UpdateAsync(GlassType glassType);
        Task DeleteAsync(int id);
    }
}
