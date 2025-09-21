using Domain.Entities;

namespace Domain.Repositories
{
    public interface ICoatingRepository
    {
        Task<IEnumerable<Coating>> GetAllAsync();
        Task<Coating?> GetByIdAsync(int id);
        Task AddAsync(Coating coating);
        Task UpdateAsync(Coating coating);
        Task DeleteAsync(int id);
        Task<Coating?> GetByNameAsync(string name);
        Task<IEnumerable<Coating>> SearchByNameAsync(string text);
    }
}
