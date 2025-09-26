using Domain.Entities;

namespace Domain.Repositories
{
    public interface IBudgetRepository
    {
        Task<List<Budget>> GetAllAsync();
        Task<Budget> GetByIdAsync(string budgetid); // método para id de mongo
        Task<Budget> GetByBudgetIdAsync(string budgetId); // método para BudgetId
        Task<List<Budget>> GetBudgetsByBudgetIdAsync(string budgetId);
        Task AddAsync(Budget entity);
        Task UpdateAsync(string id, Budget entity);
        Task DeleteAsync(string id);
        Task<List<Budget>> GetBudgetsByCustomerAsync(Customer Customer);
    }
}

