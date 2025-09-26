using Domain.Entities;

namespace Domain.Repositories
{
    public interface IComplementPartitionRepository
    {
        Task<IEnumerable<ComplementPartition>> GetAllAsync();
        Task<ComplementPartition?> GetByIdAsync(int id);
        Task<ComplementPartition?> GetByNameAsync(string name); // <-- agregado
        Task AddAsync(ComplementPartition partition);
        Task UpdateAsync(ComplementPartition partition);
        Task DeleteAsync(int id);
        Task<IEnumerable<ComplementPartition>> SearchByNameAsync(string text);
    }
}
