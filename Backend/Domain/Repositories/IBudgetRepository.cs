 using Domain.Entities;
using Domain.Enums;

namespace Domain.Repositories
{
    public interface IBudgetRepository
    {
        Task<List<Budget>> GetAllAsync();
        Task<Budget> GetByIdAsync(string budgetid); // m�todo para id de mongo
        Task<Budget> GetByBudgetIdAsync(string budgetId); // m�todo para BudgetId
        Task<List<Budget>> GetBudgetsByBudgetIdAsync(string budgetId);
        Task AddAsync(Budget entity);
        Task UpdateAsync(string id, Budget entity);
        Task DeleteAsync(string id);
        Task<List<Budget>> GetBudgetsByCustomerDniAsync(string customerDni);
        Task<List<Budget>> GetBudgetsByCustomerAsync(Customer Customer);
        Task ChangeBudgetStatus(string budgetId, BudgetStatus newStatus, string? rejectionComment = null);

    }
}

