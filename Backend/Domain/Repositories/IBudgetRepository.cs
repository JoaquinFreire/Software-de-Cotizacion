using Domain.Entities;

namespace Domain.Repositories
{
    public interface IBudgetRepository
    {
        Task<List<Budget>> GetAllAsync();
        Task<Budget> GetByIdAsync(string budgetid); // m�todo para id de mongo
        Task<Budget> GetByBudgetIdAsync(string budgetId); // m�todo para BudgetId
        Task AddAsync(Budget entity);
        Task UpdateAsync(string id, Budget entity);
        Task DeleteAsync(string id);
        Task<List<Budget>> GetBudgetsByCustomerAsync(Customer Customer);
    }
}

