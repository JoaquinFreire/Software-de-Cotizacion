using Domain.Entities;
using Domain.Repositories;

namespace Application.Services
{
    public class ComplementPartitionServices
    {
        private readonly IComplementPartitionRepository _complementPartitionRepository;

        public ComplementPartitionServices(IComplementPartitionRepository complementPartitionRepository)
        {
            _complementPartitionRepository = complementPartitionRepository;
        }
        public async Task<IEnumerable<ComplementPartition>> GetAllAsync() { return await _complementPartitionRepository.GetAllAsync(); }
        public async Task<ComplementPartition?> GetByIdAsync(int id) { return await _complementPartitionRepository.GetByIdAsync(id); }
        public async Task AddAsync(ComplementPartition partition) { await _complementPartitionRepository.AddAsync(partition); }
        public async Task UpdateAsync(ComplementPartition partition) { await _complementPartitionRepository.UpdateAsync(partition); }
        public async Task DeleteAsync(int id) { await _complementPartitionRepository.DeleteAsync(id); }
    }
}
