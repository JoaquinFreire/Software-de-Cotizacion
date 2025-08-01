using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class CoatingRepository : ICoatingRepository
    {
        private readonly AppDbContext _context;

        public CoatingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Coating>> GetAllAsync()
        {
            return await _context.Coatings.ToListAsync();
        }

        public async Task<Coating?> GetByIdAsync(int id)
        {
            return await _context.Coatings.FindAsync(id);
        }

        public async Task AddAsync(Coating coating)
        {
            _context.Coatings.Add(coating);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Coating coating)
        {
            _context.Coatings.Update(coating);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.Coatings.FindAsync(id);
            if (entity != null)
            {
                _context.Coatings.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
