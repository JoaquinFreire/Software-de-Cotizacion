using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class GlassTypeRepository : IGlassTypeRepository
    {
        private readonly AppDbContext _context;

        public GlassTypeRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GlassType>> GetAllAsync()
        {
            return await _context.GlassTypes.ToListAsync();
        }

        public async Task<GlassType?> GetByIdAsync(int id)
        {
            return await _context.GlassTypes.FindAsync(id);
        }
        public async Task<GlassType?> GetByNameAsync(string name)
        {
            return await _context.GlassTypes.FirstOrDefaultAsync(gt => gt.name == name);
        }
        public async Task AddAsync(GlassType glassType)
        {
            _context.GlassTypes.Add(glassType);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(GlassType glassType)
        {
            _context.GlassTypes.Update(glassType);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var existing = await _context.GlassTypes.FindAsync(id);
            if (existing != null)
            {
                _context.GlassTypes.Remove(existing);
                await _context.SaveChangesAsync();
            }
        }
    }
}
