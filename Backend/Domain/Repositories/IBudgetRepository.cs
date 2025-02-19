using Domain.Entities;

namespace Domain.Repositories
{
    public interface IBudgetRepository
    {
        Task<List<Budget>> GetAllAsync();
        Task<Budget> GetByIdAsync(string id);
        Task AddAsync(Budget entity);
        Task UpdateAsync(string id, Budget entity);
        Task DeleteAsync(string id);
        Task<List<Budget>> GetBudgetsByCustomerAsync(Customer Customer);
    }
}

