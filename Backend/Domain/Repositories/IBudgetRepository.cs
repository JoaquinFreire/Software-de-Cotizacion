using Domain.Entities;
using Domain.Services;
using System.Linq.Expressions;

namespace Domain.Repositories
{
    public interface IBudgetRepository: IRepository<Budget>
    {        
        Task<Budget> GetByIdAsync(string id);
        Task<IEnumerable<Budget>> FindAsync(Expression<Func<Budget, bool>> predicate);
        Task<IEnumerable<Budget>> GetAllAsync();
        Task AddAsync(Budget entity);
        Task UpdateAsync(string id, Budget entity);
        Task DeleteAsync(string id);
        Task<List<Budget>> GetBudgetsByCustomerAsync(Customer Customer);
    }
}

