using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Repositories;
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id)
    {
        return Task.FromResult<T?>(null); // Implementación por defecto
    }
    Task<T?> GetByIdAsync(string id)
    {
        return Task.FromResult<T?>(null); // Implementación por defecto
    }
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<IEnumerable<T>> GetAllAsync();
    Task AddAsync(T entity);
    Task UpdateAsync(string id, T entity);
    Task DeleteAsync(string id);
}
