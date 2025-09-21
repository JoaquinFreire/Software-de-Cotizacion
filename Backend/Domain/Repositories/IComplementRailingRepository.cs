using Domain.Entities;

namespace Domain.Repositories
{
    public interface IComplementRailingRepository
    {
        Task<IEnumerable<ComplementRailing>> GetAllAsync();
        Task<ComplementRailing?> GetByIdAsync(int id);
        Task AddAsync(ComplementRailing railing);
        Task UpdateAsync(ComplementRailing railing);
        Task DeleteAsync(int id);
        Task<IEnumerable<ComplementRailing>> SearchByNameAsync(string text);
    }
}
