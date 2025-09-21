using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class AccesoryRepository : IAccesoryRepository
    {
        private readonly AppDbContext _context;

        public AccesoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Accesory>> GetAllAsync()
        {
            return await _context.Accesories.ToListAsync();
        }

        public async Task<Accesory?> GetByIdAsync(int id)
        {
            return await _context.Accesories.FindAsync(id);
        }

        public async Task AddAsync(Accesory accesory)
        {
            _context.Accesories.Add(accesory);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Accesory accesory)
        {
            _context.Accesories.Update(accesory);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.Accesories.FindAsync(id);
            if (entity != null)
            {
                _context.Accesories.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Accesory>> SearchByNameAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return Enumerable.Empty<Accesory>();
            var lower = text.ToLower();
            return await _context.Accesories
                .Where(a => EF.Functions.Like(a.name.ToLower(), $"%{lower}%"))
                .ToListAsync();
        }
    }
}
