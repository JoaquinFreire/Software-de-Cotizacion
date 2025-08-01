using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class ComplementPartitionRepository : IComplementPartitionRepository
    {
        private readonly AppDbContext _context;

        public ComplementPartitionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ComplementPartition>> GetAllAsync()
        {
            return await _context.ComplementPartitions.ToListAsync();
        }

        public async Task<ComplementPartition?> GetByIdAsync(int id)
        {
            return await _context.ComplementPartitions.FindAsync(id);
        }

        public async Task AddAsync(ComplementPartition partition)
        {
            _context.ComplementPartitions.Add(partition);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ComplementPartition partition)
        {
            _context.ComplementPartitions.Update(partition);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.ComplementPartitions.FindAsync(id);
            if (entity != null)
            {
                _context.ComplementPartitions.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
