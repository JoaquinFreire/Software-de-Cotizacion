using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ComplementRepository : IComplementRepository
{
    private readonly AppDbContext _context;

    public ComplementRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Complement>> GetAllAsync()
    {
        return await _context.Complements
            .Include(c => c.type)
            .ToListAsync();
    }

    public async Task<Complement?> GetByIdAsync(int id)
    {
        return await _context.Complements
            .Include(c => c.type)
            .FirstOrDefaultAsync(c => c.id == id);
    }

    public async Task AddAsync(Complement complement)
    {
        _context.Complements.Add(complement);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Complement complement)
    {
        _context.Complements.Update(complement);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var complement = await _context.Complements.FindAsync(id);
        if (complement != null)
        {
            _context.Complements.Remove(complement);
            await _context.SaveChangesAsync();
        }
    }
}
