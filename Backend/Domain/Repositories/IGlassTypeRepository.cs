using Domain.Entities;

namespace Domain.Repositories
{
    public interface IGlassTypeRepository
    {
        Task<IEnumerable<GlassType>> GetAllAsync();
        Task<GlassType?> GetByIdAsync(int id);
        Task AddAsync(GlassType glassType);
        Task UpdateAsync(GlassType glassType);
        Task DeleteAsync(int id);
    }
}
