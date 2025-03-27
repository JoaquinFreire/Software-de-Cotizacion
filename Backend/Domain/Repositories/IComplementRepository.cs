using Domain.Entities;

namespace Domain.Repositories;

public interface IComplementRepository
{
    Task<IEnumerable<Complement>> GetAllAsync();
    Task<Complement?> GetByIdAsync(int id);
    Task AddAsync(Complement complement);
    Task UpdateAsync(Complement complement);
    Task DeleteAsync(int id);
}
