using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;
public class AccesoriesRepository : IAccesoryRepository
{
    private readonly AppDbContext _context;
    public AccesoriesRepository(AppDbContext context)
    {
        _context = context;
    }
    public async Task AddAsync(Accesory accessory)
    {
        _context.Accesories.Add(accessory);
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
    public async Task<IEnumerable<Accesory>> GetAllAsync() => await _context.Accesories.ToListAsync();

    public async Task<Accesory?> GetByIdAsync(int id) => await _context.Accesories.FindAsync(id);

    public async Task UpdateAsync(Accesory accessory)
    {
        _context.Accesories.Update(accessory);
            await _context.SaveChangesAsync();
    }
}
