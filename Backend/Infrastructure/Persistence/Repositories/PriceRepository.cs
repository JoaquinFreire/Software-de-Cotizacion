using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class PriceRepository : IPriceRepository
    {
        private readonly AppDbContext _context;

        public PriceRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Price>> GetAllAsync()
        {
            return await _context.Prices.ToListAsync();
        }

        public async Task<Price?> GetByIdAsync(int id)
        {
            return await _context.Prices.FindAsync(id);
        }

        public async Task AddAsync(Price price)
        {
            _context.Prices.Add(price);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Price price)
        {
            _context.Prices.Update(price);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var price = await _context.Prices.FindAsync(id);
            if (price != null)
            {
                _context.Prices.Remove(price);
                await _context.SaveChangesAsync();
            }
        }
    }
}
