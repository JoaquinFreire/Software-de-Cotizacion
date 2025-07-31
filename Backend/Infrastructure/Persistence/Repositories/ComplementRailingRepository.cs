using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class ComplementRailingRepository : IComplementRailingRepository
    {
        private readonly AppDbContext _context;

        public ComplementRailingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ComplementRailing>> GetAllAsync()
        {
            return await _context.ComplementRailings.ToListAsync();
        }

        public async Task<ComplementRailing?> GetByIdAsync(int id)
        {
            return await _context.ComplementRailings.FindAsync(id);
        }

        public async Task AddAsync(ComplementRailing railing)
        {
            _context.ComplementRailings.Add(railing);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ComplementRailing railing)
        {
            _context.ComplementRailings.Update(railing);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.ComplementRailings.FindAsync(id);
            if (entity != null)
            {
                _context.ComplementRailings.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
