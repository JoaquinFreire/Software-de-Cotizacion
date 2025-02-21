using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Repositories;
public interface IRepository<T> where T : class //La restricción where T : class indica que T debe ser una clase (no puede ser un tipo primitivo como int o double).
{
    Task<T?> GetByIdAsync(Guid id);  // Obtiene un objeto por ID
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);  // Filtra objetos por una condición
}
