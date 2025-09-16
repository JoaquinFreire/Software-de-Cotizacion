using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class OpeningTypeRepository : IOpeningTypeRepository
{
    private readonly AppDbContext _context;

    public OpeningTypeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Opening_Type>> GetAllAsync()
        => await _context.Opening_Types.ToListAsync();

    public async Task<Opening_Type?> GetByIdAsync(int id)
        => await _context.Opening_Types.FindAsync(id);

    public async Task<Opening_Type?> GetByNameAsync(string name)
        => await _context.Opening_Types.FirstOrDefaultAsync(ot => ot.name == name);

    public async Task AddAsync(Opening_Type openingType)
    {
        _context.Opening_Types.Add(openingType);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Opening_Type openingType)
    {
        _context.Opening_Types.Update(openingType);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.Opening_Types.FindAsync(id);
        if (entity != null)
        {
            _context.Opening_Types.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}
