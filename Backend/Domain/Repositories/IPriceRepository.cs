using Domain.Entities;

namespace Domain.Repositories
{
    public interface IPriceRepository
    {
        Task<IEnumerable<Price>> GetAllAsync();
        Task<Price?> GetByIdAsync(int id);
        Task AddAsync(Price price);
        Task UpdateAsync(Price price);
        Task DeleteAsync(int id);
    }
}
