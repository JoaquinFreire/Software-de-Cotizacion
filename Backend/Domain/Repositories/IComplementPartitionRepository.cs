using Domain.Entities;

namespace Domain.Repositories
{
    public interface IComplementPartitionRepository
    {
        Task<IEnumerable<ComplementPartition>> GetAllAsync();
        Task<ComplementPartition?> GetByIdAsync(int id);
        Task AddAsync(ComplementPartition partition);
        Task UpdateAsync(ComplementPartition partition);
        Task DeleteAsync(int id);
    }
}
