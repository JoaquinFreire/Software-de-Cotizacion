using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
namespace Infrastructure.Persistence.Repositories;

public class MaterialTypeRepository : IMaterialTypeRepository
{
    private readonly AppDbContext _context;

    public MaterialTypeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MaterialType>> GetAllAsync()
    {
        return await _context.MaterialTypes.Include(mt => mt.category).ToListAsync();
    }
}

