using Domain.Entities;

namespace Domain.Repositories;

public interface IAccesoryRepository 
{
        Task<IEnumerable<Accesory>> GetAllAsync();
        Task<Accesory?> GetByIdAsync(int id);
        Task<Accesory> GetByNameAsync(string name);
        Task AddAsync(Accesory treatment);
        Task UpdateAsync(Accesory treatment);
        Task DeleteAsync(int id);
        Task<IEnumerable<Accesory>> SearchByNameAsync(string text);
}
