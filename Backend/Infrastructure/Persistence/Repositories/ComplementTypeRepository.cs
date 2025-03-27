using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ComplementTypeRepository : IComplementTypeRepository
{
    private readonly AppDbContext _context;

    public ComplementTypeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ComplementType>> GetAllAsync()
    {
        return await _context.ComplementTypes.ToListAsync();
    }
}
